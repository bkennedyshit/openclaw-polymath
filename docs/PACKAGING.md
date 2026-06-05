# Packaging

This repo is the OpenClaw-facing package for Polymath visual memory and Mneme
GPU broker controls. It is intended to be downloadable as one package that
contains both:

- the `mneme` OpenClaw plugin entry
- the `visual-memory` OpenClaw skill

## Release Surfaces

1. `mneme-mcp` as the standalone local MCP server installed through `mcporter`.
2. `@nepa-ai/openclaw-polymath` as the OpenClaw plugin + skill package.
3. ClawHub listing for users who want the package through https://clawhub.ai/.

## Include

- Generic visual-memory skill instructions.
- Mneme OpenClaw plugin entry.
- GPU broker Control UI/backend integration routes and gateway methods.
- OpenClaw/mcporter install docs.
- Security and privacy notes.
- Generic creator examples.

## Exclude

- Private creator skills.
- Brand-specific prompts or workflows.
- Local media, indexes, auth files, logs, and generated databases.
- Native GPU binaries until reproducible distribution is ready.

## User Install Shape

Users should be able to install the local MCP server, then install this package
as the OpenClaw plugin/skill combo:

```bash
mcporter add mneme -- uvx --from 'mneme-mcp[clip,video]' mneme-mcp
openclaw plugins install @nepa-ai/openclaw-polymath
openclaw plugins enable mneme
```

The package declares its plugin entry and bundled skill in `package.json`:

- plugin: `plugin/index.mjs`
- skill: `skills/visual-memory`

## Public Listing Notes

The public listing should make three points clear:

- Mneme is the local MCP engine for media search and GPU broker tools.
- OpenClaw Polymath is the installable OpenClaw plugin + skill package.
- Additional paid OpenClaw skills and creator automations are available at
  https://axon.nepa-ai.com, while Mneme product information lives at
  https://mneme.nepa-ai.com.

## Release Checklist

- Run a leak scan for private terms and credentials.
- Verify `npm pack` includes `plugin/`, `skills/`, `ui/`, docs, README, and LICENSE.
- Verify `mcporter add mneme -- uvx --from 'mneme-mcp[clip,video]' mneme-mcp`.
- Verify `openclaw plugins install <package>` enables plugin discovery.
- Verify the `visual-memory` skill appears in the OpenClaw skill install path or ClawHub listing.
- Verify tool list includes media tools plus `gpu_status`, `gpu_release`, `gpu_reclaim`, and `gpu_evacuate`.
- Tag the repo once the matching standalone MCP package is verified locally.
