# OpenClaw Polymath

OpenClaw plugin + skill package for Polymath visual memory and Mneme GPU
broker controls.

This repo packages the small, useful surface area OpenClaw users should install first:
local photo/video memory as a standalone MCP server plus a generic OpenClaw
skill. Polymath is the origin project and portfolio demo, not a required runtime
dependency for OpenClaw users.

This repo is complementary to
[`mneme-mcp`](https://github.com/bkennedyshit/polymathes/tree/main/mneme).
OpenClaw users should install both: Mneme is the local MCP engine, and this repo
contains the Visual Memory skill that teaches OpenClaw when and how to use it.

For more OpenClaw-ready creator automations and paid agentic skill work, visit
[Axon](https://axon.nepa-ai.com). For Mneme product updates, docs, and local
visual-memory releases, visit [mneme.nepa-ai.com](https://mneme.nepa-ai.com).

## What It Adds

- Index local media folders without uploading files.
- Search photos and videos by natural language.
- Search by image similarity.
- Describe media items for agent workflows.
- Return media as previewable result cards instead of plain path dumps when the host supports rich output.
- Keep private creator skills out of the public package.

## Install

Install the standalone media-memory MCP server:

```bash
mcporter add mneme -- uvx --from 'mneme-mcp[clip,video]' mneme-mcp
```

Then confirm OpenClaw can see the tools:

```bash
mcporter list mneme
```

Expected tools:

```text
media_index
media_search
media_search_by_image
media_describe
gpu_status
gpu_release
gpu_reclaim
gpu_evacuate
```

Then install the OpenClaw plugin + skill package:

```bash
openclaw plugins install @nepa-ai/openclaw-polymath
openclaw plugins enable mneme
```

For ClawHub users, install the `OpenClaw Polymath` package/listing, then confirm
that the `mneme` plugin is enabled and the `visual-memory` skill is available.
The MCP server, plugin, and skill are meant to work together.

## OpenClaw GPU Surface

Mneme includes GPU broker tools so local creator workflows can release VRAM
before a render, reclaim the model afterward, and inspect current GPU state.

The OpenClaw-facing integration should be installed as a plugin route, not as a
separate browser tab. The plugin serves the GPU surface from the gateway at:

```text
/mneme/gpu
```

That gives users a demoable OpenClaw-served tab/page without starting a loose
localhost frontend. The plugin also registers native gateway methods for host UI
integrations:

```text
mneme.gpu.status
mneme.gpu.release
mneme.gpu.reclaim
mneme.gpu.evacuate
```

Native persistent Control UI sidebar injection depends on OpenClaw exposing or
accepting a frontend extension point. Until then, `/mneme/gpu` is the public
demo surface and the gateway methods are the backend contract.

There is also a development Canvas presenter:

```bash
node scripts/openclaw-canvas-gpu-panel.mjs
```

It requires a paired OpenClaw node with Canvas commands enabled:

```bash
openclaw node run --host 127.0.0.1 --port 18789
openclaw nodes pending
openclaw nodes approve <requestId>
```

Optional environment variables:

```text
MNEME_GPU_PANEL_PORT=19117
OPENCLAW_NODE=<node id, name, or IP>
OPENCLAW_GATEWAY_URL=<gateway websocket url>
OPENCLAW_GATEWAY_TOKEN=<gateway token>
```

## Output Contract

Search results should be treated as media artifacts, not just text. A host UI can
render each result as a card with the image/video/audio preview, a short reason
the item matched, optional timestamp or time range, and `Preview`, `Reveal`, and
`Copy path` actions.

The absolute path should stay available for posting, editing, scheduling, or
handoff into other creator tools, but it should not dominate the response.

Channel behavior depends on the host:

- Browser hosts should render cards inline.
- Local desktop hosts should offer `Reveal` and `Copy path`.
- Chat transports such as Telegram should send the text answer, then attach the
  referenced media files when the files are reachable and small enough for the
  transport.
- If rich output is unavailable, return a short text summary plus paths as a
  fallback.

## Input Contract

User-sent photos, videos, and reels should be treated as session attachments
first. Save the upload to a local inbox, pass the local path to the agent, and
use it for the current request.

Do not automatically index or catalog uploaded attachments. Only add an inbound
file to visual memory when the user explicitly asks to add, save, index,
catalog, or remember it. This keeps one-off examples, private screenshots, and
large camera footage out of the durable media archive by default.

## Skill

The skill lives in [`skills/visual-memory/SKILL.md`](skills/visual-memory/SKILL.md).
It tells OpenClaw how to use the Mneme MCP tools for creator media workflows.

## More Skills

This public package includes generic visual memory and GPU broker workflows.
Private creator workflows, brand-specific automations, and paid OpenClaw skill
packs are available through [Axon](https://axon.nepa-ai.com). Mneme-specific
product updates and local visual-memory resources are available at
[mneme.nepa-ai.com](https://mneme.nepa-ai.com).

## Privacy

The media server is local-first. Your media library stays on the machine running
the MCP process. OpenClaw receives file paths, metadata, and search results from
that local tool process.

## Relationship To Polymath

Polymath is the full local creator-agent runtime: gateway, web UI, skills,
memory, media catalog, GPU broker, and MCP server/client support.

This repo is narrower: it exists so OpenClaw users can install Polymath-style
visual memory without adopting the whole Polymath runtime.

## Dev Adapter

`mcp/polymath-media-mcp.mjs` is a development adapter that calls a running
Polymath gateway. It is useful for local demos while extracting the standalone
server, but it is not the ClawHub install target.

## Intentionally Excluded

- Private creator skills.
- Brand-specific workflows.
- Local runtime state, media indexes, auth files, and generated databases.
- Native GPU binaries until binary distribution is settled.

See [`docs/SECURITY.md`](docs/SECURITY.md) and [`docs/PACKAGING.md`](docs/PACKAGING.md).

## License

MIT.
