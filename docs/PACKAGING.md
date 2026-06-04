# Packaging

This repo is the OpenClaw-facing package for Polymath visual memory.

## Release Surfaces

1. `mneme-mcp` as the standalone OpenClaw-facing MCP server.
2. `openclaw-polymath` on GitHub for OpenClaw install docs and skill metadata.
3. Optional ClawHub listing after the install shape is verified.

## Include

- Generic visual-memory skill instructions.
- OpenClaw/mcporter install docs.
- Security and privacy notes.
- Generic creator examples.

## Exclude

- Private creator skills.
- Brand-specific prompts or workflows.
- Local media, indexes, auth files, logs, and generated databases.
- Native GPU binaries until reproducible distribution is ready.

## Release Checklist

- Run a leak scan for private terms and credentials.
- Verify `mcporter add mneme -- uvx --from 'mneme-mcp[clip,video]' mneme-mcp`.
- Verify tool list includes `media_index`, `media_search`, `media_search_by_image`, and `media_describe`.
- Tag the repo once the matching standalone MCP package is verified locally.
