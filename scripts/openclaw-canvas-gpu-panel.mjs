import { execFile, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const panelServer = join(__dirname, "gpu-panel-server.mjs");
const port = Number(process.env.MNEME_GPU_PANEL_PORT || 19117);
const target = process.env.MNEME_GPU_PANEL_URL || `http://127.0.0.1:${port}/`;
const timeoutMs = Number(process.env.MNEME_GPU_PANEL_TIMEOUT_MS || 10000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function exec(command, args) {
  return new Promise((resolve, reject) => {
    const file = process.platform === "win32" && command.toLowerCase().endsWith(".cmd")
      ? "cmd.exe"
      : command;
    const finalArgs = file === "cmd.exe" ? ["/d", "/s", "/c", command, ...args] : args;
    execFile(file, finalArgs, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || stdout || err.message));
        return;
      }
      resolve(stdout);
    });
  });
}

async function findOpenClaw() {
  if (process.env.OPENCLAW_BIN) return process.env.OPENCLAW_BIN;
  if (process.platform === "win32") {
    try {
      const stdout = await exec("where.exe", ["openclaw.cmd"]);
      return stdout.trim().split(/\r?\n/)[0] || "openclaw.cmd";
    } catch {
      return "openclaw.cmd";
    }
  }
  return "openclaw";
}

function flattenNodes(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenNodes);
  if (typeof value !== "object") return [];

  const ownId = value.id || value.nodeId || value.name || value.ip;
  const nested = [
    ...flattenNodes(value.nodes),
    ...flattenNodes(value.connected),
    ...flattenNodes(value.pending),
    ...flattenNodes(value.items),
    ...flattenNodes(value.results),
  ];

  if (ownId) return [value, ...nested];
  return nested;
}

async function resolveNode(openclaw) {
  if (process.env.OPENCLAW_NODE) return process.env.OPENCLAW_NODE;

  const args = ["nodes", "list", "--json", "--connected"];
  if (process.env.OPENCLAW_GATEWAY_URL) args.push("--url", process.env.OPENCLAW_GATEWAY_URL);
  if (process.env.OPENCLAW_GATEWAY_TOKEN) args.push("--token", process.env.OPENCLAW_GATEWAY_TOKEN);

  let parsed;
  try {
    parsed = JSON.parse(await exec(openclaw, args));
  } catch (err) {
    throw new Error(
      `Could not list OpenClaw nodes. Start/pair an OpenClaw node, or set OPENCLAW_NODE manually. ${err.message || err}`,
    );
  }

  const nodes = flattenNodes(parsed).filter((node) => node.connected !== false && node.status !== "disconnected");
  const node = nodes[0];
  const id = node?.id || node?.nodeId || node?.name || node?.ip;
  if (!id) {
    throw new Error("No connected OpenClaw node found. Start/pair a node, or set OPENCLAW_NODE manually.");
  }
  return id;
}

async function panelIsUp() {
  try {
    const res = await fetch(target, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensurePanelServer() {
  if (await panelIsUp()) return;

  const child = spawn(process.execPath, [panelServer], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: {
      ...process.env,
      MNEME_GPU_PANEL_PORT: String(port),
    },
  });
  child.unref();

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await panelIsUp()) return;
    await sleep(250);
  }

  throw new Error(`Mneme GPU panel did not start at ${target}`);
}

async function main() {
  await ensurePanelServer();

  const openclaw = await findOpenClaw();
  const node = await resolveNode(openclaw);
  const args = ["nodes", "canvas", "present", "--target", target, "--width", "520", "--height", "680"];
  args.push("--node", node);
  if (process.env.OPENCLAW_GATEWAY_URL) args.push("--url", process.env.OPENCLAW_GATEWAY_URL);
  if (process.env.OPENCLAW_GATEWAY_TOKEN) args.push("--token", process.env.OPENCLAW_GATEWAY_TOKEN);

  const stdout = await exec(openclaw, args);
  if (stdout.trim()) process.stdout.write(stdout);
  console.log(`Mneme GPU panel presented inside OpenClaw Canvas on node ${node}: ${target}`);
}

main().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});
