# OpenClaw Polymath

OpenClaw integration package for Polymath visual memory.

This repo packages the small, useful surface area OpenClaw users should install first:
local photo/video memory through `mneme-mcp`, exposed as MCP tools and a generic
OpenClaw skill. The full Polymath agent runtime remains a separate project.

## What It Adds

- Index local media folders without uploading files.
- Search photos and videos by natural language.
- Search by image similarity.
- Describe media items for agent workflows.
- Keep private creator skills out of the public package.

## Install

```bash
mcporter add mneme -- uvx --from 'mneme-mcp[clip,video]' mneme-mcp
```

Optional configuration:

```bash
MNEME_DB_PATH=~/.mneme/mneme.db \
MNEME_BACKEND=auto \
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
```

## Skill

The skill lives in [`skills/visual-memory/SKILL.md`](skills/visual-memory/SKILL.md).
It tells OpenClaw how to use the Mneme MCP tools for creator media workflows.

## Privacy

Mneme is local-first. Your media library stays on the machine running the MCP
server. OpenClaw receives file paths, metadata, and search results from the local
tool process.

## Relationship To Polymath

Polymath is the full local creator-agent runtime: gateway, web UI, skills,
memory, media catalog, GPU broker, and MCP server/client support.

This repo is narrower: it exists so OpenClaw users can install Polymath-style
visual memory without adopting the whole Polymath runtime.

## Intentionally Excluded

- Private creator skills.
- Brand-specific workflows.
- Local runtime state, media indexes, auth files, and generated databases.
- Native GPU binaries until binary distribution is settled.

See [`docs/SECURITY.md`](docs/SECURITY.md) and [`docs/PACKAGING.md`](docs/PACKAGING.md).

## License

MIT.
