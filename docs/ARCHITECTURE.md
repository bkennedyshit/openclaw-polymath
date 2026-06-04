# Architecture

This package is not meant to make users install Polymath as a second agent
framework.

Polymath is the origin project and full portfolio demo. The OpenClaw-facing
package should extract the useful capability into a standalone install:

```text
OpenClaw agent
  -> visual-memory skill
  -> mneme MCP tools
  -> local media index + visual/text search
  -> previewable media results
```

## Pieces

`visual-memory` is the skill. It is only the agent instruction layer: when to
use media search, how to handle uploaded files, when not to index private
attachments, and how to return previewable media results.

`mneme` is the intended standalone MCP server/package. It should expose:

- `media_index`
- `media_search`
- `media_search_by_image`
- `media_describe`

The implementation should be extracted from Polymath's media-memory/content RAG
work so OpenClaw, Hermes, or any MCP host can use it without running the full
Polymath app.

`mcp/polymath-media-mcp.mjs` is only a development adapter. It calls a running
Polymath gateway and proves the tool contract against the current Polymath demo
system. It is not the public ClawHub install path.

## Contribution Angle

The likely OpenClaw contribution is not "merge Polymath." It is one of:

- an official media artifact output contract for preview/reveal/copy behavior;
- a ClawHub skill using the standalone MCP server;
- a PR/example showing OpenClaw calling local visual media memory through MCP.

That gives users a small install surface while still pointing back to Polymath as
the full creator-agent runtime.
