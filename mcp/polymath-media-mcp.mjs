#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const gateway = process.env.POLYMATH_GATEWAY_URL || "http://127.0.0.1:18789";
const token =
  process.env.POLYMATH_TOKEN ||
  readIfExists(path.join(os.homedir(), ".polymath", "auth.key"))?.trim();

const TOOLS = [
  {
    name: "media_index",
    description: "Index a local folder into Polymath media memory.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path to index." },
        frame_interval: { type: "number", description: "Seconds between sampled video frames." },
        force: { type: "boolean", description: "Re-index files already seen." },
      },
      required: ["path"],
    },
  },
  {
    name: "media_search",
    description: "Search Polymath indexed media by text, metadata, and visual similarity.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language query." },
        top_k: { type: "integer", description: "Maximum results." },
        min_score: { type: "number", description: "Minimum visual similarity score." },
        type_filter: { type: "string", description: "image, video_segment, audio_segment, document, or code." },
        brand: { type: "string" },
        category: { type: "string" },
        kind: { type: "string", description: "image, video, or audio." },
      },
      required: ["query"],
    },
  },
  {
    name: "media_search_by_image",
    description: "Search Polymath indexed media using an image path as the visual query.",
    inputSchema: {
      type: "object",
      properties: {
        image_path: { type: "string", description: "Absolute path to the query image." },
        top_k: { type: "integer", description: "Maximum results." },
      },
      required: ["image_path"],
    },
  },
  {
    name: "media_describe",
    description: "Fetch a compact Polymath media record by id or path.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Polymath media id." },
        path: { type: "string", description: "Absolute media path." },
      },
    },
  },
];

function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function send(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function ok(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function err(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

async function invoke(tool, args) {
  if (!token) throw new Error("POLYMATH_TOKEN is not set and ~/.polymath/auth.key was not readable.");
  const res = await fetch(`${gateway}/api/actions/invoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tool, args }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Polymath returned non-JSON HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  if (!res.ok || json?.ok === false || json?.result?.ok === false) {
    throw new Error(json?.result?.error || json?.error || `Polymath HTTP ${res.status}`);
  }
  return json.result;
}

function contentJson(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

async function callTool(name, args) {
  if (name === "media_index") {
    return contentJson(await invoke("media-memory.media_index", args));
  }

  if (name === "media_search") {
    const topK = args.top_k ?? args.k ?? 8;
    const visual = await invoke("media.vision_search", compact({
      query: args.query,
      k: topK,
      brand: args.brand,
      category: args.category,
      kind: args.kind,
      type_filter: args.type_filter,
      min_score: args.min_score,
    }));
    if (Array.isArray(visual?.results) && visual.results.length > 0) return contentJson(visual);

    return contentJson(await invoke("media.query", compact({
      query: args.query,
      limit: topK,
      brand: args.brand,
      category: args.category,
      kind: args.kind,
    })));
  }

  if (name === "media_search_by_image") {
    return contentJson(await invoke("media.vision_search", { query: args.image_path, k: args.top_k ?? 8 }));
  }

  if (name === "media_describe") {
    const query = args.path || args.id;
    if (!query) throw new Error("media_describe requires id or path.");
    return contentJson(await invoke("media.query", { query, limit: 1 }));
  }

  throw new Error(`Unknown tool: ${name}`);
}

function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (!line.trim()) continue;
    let req;
    try {
      req = JSON.parse(line);
    } catch (e) {
      err(null, -32700, `Parse error: ${e.message}`);
      continue;
    }

    const id = req.id ?? null;
    try {
      if (req.method === "initialize") {
        ok(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "polymath-media", version: "0.1.0" },
        });
      } else if (req.method === "notifications/initialized") {
        continue;
      } else if (req.method === "tools/list") {
        ok(id, { tools: TOOLS });
      } else if (req.method === "tools/call") {
        ok(id, await callTool(req.params?.name, req.params?.arguments || {}));
      } else {
        err(id, -32601, `Method not found: ${req.method}`);
      }
    } catch (e) {
      err(id, -32603, e.message || String(e));
    }
  }
});
