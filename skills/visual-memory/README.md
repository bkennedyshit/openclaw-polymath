# Visual Memory Skill

This OpenClaw skill wraps the `mneme-mcp` visual memory server.

## Install Server

```bash
mcporter add mneme -- uvx --from 'mneme-mcp[clip,video]' mneme-mcp
```

## Tools

- `media_index`: index a folder of photos/videos.
- `media_search`: natural-language visual search.
- `media_search_by_image`: image-to-image similarity search.
- `media_describe`: describe a media file.

## Example

```text
Index ~/CreatorArchive, then find vertical product shots from brand-a that could
work as a blog header.
```

OpenClaw should call `media_index` first if needed, then `media_search`, and
return paths plus short reasons for each match.
