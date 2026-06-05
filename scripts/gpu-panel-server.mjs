import { execFile } from "node:child_process";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "ui", "gpu-panel.html");
const port = Number(process.env.MNEME_GPU_PANEL_PORT || 19117);
const mcporterCwd = process.env.MCPORTER_CWD || "C:\\Users\\billk\\projects";
let mcporterBin = process.env.MCPORTER_BIN || null;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("request body too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function exec(command, args) {
  return new Promise((resolve, reject) => {
    const file = process.platform === "win32" && command.toLowerCase().endsWith(".cmd")
      ? "cmd.exe"
      : command;
    const finalArgs = file === "cmd.exe" ? ["/d", "/s", "/c", command, ...args] : args;
    execFile(file, finalArgs, { cwd: mcporterCwd, windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || stdout || err.message));
        return;
      }
      resolve(stdout);
    });
  });
}

async function findMcporter() {
  if (mcporterBin) return mcporterBin;
  if (process.platform === "win32") {
    try {
      const stdout = await exec("where.exe", ["mcporter.cmd"]);
      mcporterBin = stdout.trim().split(/\r?\n/)[0];
      return mcporterBin;
    } catch {
      mcporterBin = "mcporter.cmd";
      return mcporterBin;
    }
  }
  mcporterBin = "mcporter";
  return mcporterBin;
}

async function mcporter(tool, args = {}) {
  const flatArgs = [];
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || value === "") continue;
    flatArgs.push(`${key}=${String(value)}`);
  }

  const stdout = await exec(await findMcporter(), ["call", `mneme.${tool}`, ...flatArgs]);
  try {
    return JSON.parse(stdout);
  } catch {
    return { result: stdout.trim() };
  }
}

async function route(req, res) {
  try {
    if (req.method === "GET" && req.url === "/") {
      const html = await readFile(htmlPath, "utf8");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/api/gpu/")) {
      const action = req.url.split("/").pop();
      const body = await readBody(req);
      const toolByAction = {
        status: "gpu_status",
        release: "gpu_release",
        reclaim: "gpu_reclaim",
        evacuate: "gpu_evacuate",
      };
      const tool = toolByAction[action];
      if (!tool) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "unknown GPU action" }));
        return;
      }
      const payload = await mcporter(tool, body);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: err.message || String(err) }));
  }
}

http.createServer(route).listen(port, "127.0.0.1", () => {
  console.log(`Mneme GPU panel: http://127.0.0.1:${port}/`);
});
