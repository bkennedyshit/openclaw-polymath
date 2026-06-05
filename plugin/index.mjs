import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "ui", "gpu-panel.html");
const mcporterCwd = process.env.MCPORTER_CWD || root;
const polymathGateway = process.env.POLYMATH_GATEWAY_URL || "http://127.0.0.1:18789";
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

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
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
      mcporterBin = stdout.trim().split(/\r?\n/)[0] || "mcporter.cmd";
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

function readIfExists(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function polymathToken() {
  return (
    process.env.POLYMATH_TOKEN ||
    readIfExists(join(homedir(), ".polymath", "auth.key")).trim()
  );
}

function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

async function invokePolymath(tool, args = {}) {
  const token = polymathToken();
  if (!token) {
    throw new Error("POLYMATH_TOKEN is not set and ~/.polymath/auth.key was not readable.");
  }

  const response = await fetch(`${polymathGateway}/api/actions/invoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tool, args }),
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Polymath returned non-JSON HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  if (!response.ok || json?.ok === false || json?.result?.ok === false) {
    throw new Error(json?.result?.error || json?.error || `Polymath HTTP ${response.status}`);
  }

  return json.result;
}

async function mediaSearch(args = {}) {
  const topK = args.top_k ?? args.k ?? 8;
  const visual = await invokePolymath("media.vision_search", compact({
    query: args.query,
    k: topK,
    brand: args.brand,
    category: args.category,
    kind: args.kind,
    type_filter: args.type_filter,
    min_score: args.min_score,
  }));

  if (Array.isArray(visual?.results) && visual.results.length > 0) return visual;

  return invokePolymath("media.query", compact({
    query: args.query,
    limit: topK,
    brand: args.brand,
    category: args.category,
    kind: args.kind,
  }));
}

async function mediaTool(tool, args = {}) {
  if (tool === "index") return invokePolymath("media-memory.media_index", args);
  if (tool === "search") return mediaSearch(args);
  if (tool === "searchByImage") {
    return invokePolymath("media.vision_search", { query: args.image_path, k: args.top_k ?? 8 });
  }
  if (tool === "describe") {
    const query = args.path || args.id;
    if (!query) throw new Error("media.describe requires id or path.");
    return invokePolymath("media.query", { query, limit: 1 });
  }
  throw new Error(`Unknown media tool: ${tool}`);
}

async function handleGpuMethod(tool, params, respond) {
  try {
    respond(true, await mcporter(tool, params ?? {}));
  } catch (err) {
    respond(false, void 0, {
      code: "MNEME_GPU_ERROR",
      message: err.message || String(err),
    });
  }
}

async function handleMediaMethod(tool, params, respond) {
  try {
    respond(true, await mediaTool(tool, params ?? {}));
  } catch (err) {
    respond(false, void 0, {
      code: "POLYMATH_MEDIA_ERROR",
      message: err.message || String(err),
    });
  }
}

async function handleGpuRoute(req, res) {
  const pathname = (req.url || "/").split("?")[0];

  if (req.method === "GET" && (pathname === "/mneme/gpu" || pathname === "/mneme/gpu/")) {
    const html = await readFile(htmlPath, "utf8");
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
    return true;
  }

  if (req.method === "POST" && pathname.startsWith("/mneme/gpu/api/")) {
    const action = pathname.split("/").pop();
    const toolByAction = {
      status: "gpu_status",
      release: "gpu_release",
      reclaim: "gpu_reclaim",
      evacuate: "gpu_evacuate",
    };
    const tool = toolByAction[action];
    if (!tool) {
      sendJson(res, 404, { error: "unknown GPU action" });
      return true;
    }
    const body = await readBody(req);
    sendJson(res, 200, await mcporter(tool, body));
    return true;
  }

  return false;
}

async function handleMediaRoute(req, res) {
  const pathname = (req.url || "/").split("?")[0];

  if (req.method === "POST" && pathname.startsWith("/mneme/media/api/")) {
    const action = pathname.split("/").pop();
    const toolByAction = {
      index: "index",
      search: "search",
      searchByImage: "searchByImage",
      describe: "describe",
    };
    const tool = toolByAction[action];
    if (!tool) {
      sendJson(res, 404, { error: "unknown media action" });
      return true;
    }
    const body = await readBody(req);
    sendJson(res, 200, await mediaTool(tool, body));
    return true;
  }

  return false;
}

export default definePluginEntry({
  id: "mneme",
  name: "Mneme Visual Memory",
  description: "Local visual memory and GPU broker surfaces for OpenClaw.",
  register(api) {
    api.registerHttpRoute({
      path: "/mneme/ping",
      auth: "plugin",
      match: "exact",
      handler: async (_req, res) => {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        res.end("mneme ok");
        return true;
      },
    });

    api.registerHttpRoute({
      path: "/mneme/gpu",
      auth: "plugin",
      match: "prefix",
      handler: async (req, res) => {
        try {
          return await handleGpuRoute(req, res);
        } catch (err) {
          sendJson(res, 500, { error: err.message || String(err) });
          return true;
        }
      },
    });

    api.registerHttpRoute({
      path: "/mneme/media",
      auth: "plugin",
      match: "prefix",
      handler: async (req, res) => {
        try {
          return await handleMediaRoute(req, res);
        } catch (err) {
          sendJson(res, 500, { error: err.message || String(err) });
          return true;
        }
      },
    });

    api.registerGatewayMethod("mneme.gpu.status", async ({ params, respond }) => {
      await handleGpuMethod("gpu_status", params, respond);
    });

    api.registerGatewayMethod("mneme.gpu.release", async ({ params, respond }) => {
      await handleGpuMethod("gpu_release", params, respond);
    });

    api.registerGatewayMethod("mneme.gpu.reclaim", async ({ params, respond }) => {
      await handleGpuMethod("gpu_reclaim", params, respond);
    });

    api.registerGatewayMethod("mneme.gpu.evacuate", async ({ params, respond }) => {
      await handleGpuMethod("gpu_evacuate", params, respond);
    });

    api.registerGatewayMethod("mneme.media.index", async ({ params, respond }) => {
      await handleMediaMethod("index", params, respond);
    });

    api.registerGatewayMethod("mneme.media.search", async ({ params, respond }) => {
      await handleMediaMethod("search", params, respond);
    });

    api.registerGatewayMethod("mneme.media.searchByImage", async ({ params, respond }) => {
      await handleMediaMethod("searchByImage", params, respond);
    });

    api.registerGatewayMethod("mneme.media.describe", async ({ params, respond }) => {
      await handleMediaMethod("describe", params, respond);
    });
  },
});
