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
return previewable media cards plus short reasons for each match. Keep absolute
paths available through `Copy path` or similar actions, but show the actual
image/video/audio result first when the host UI supports it.

If the host is a chat channel instead of a browser UI, send the text answer first
and then attach the referenced media files when the local runtime can access
them. If the file is too large or not reachable from that runtime, fall back to a
short note plus the path.
