---
name: visual-memory
description: Use local visual memory tools to index and search photos and videos from creator media libraries.
tools:
  - media_index
  - media_search
  - media_search_by_image
  - media_describe
---

# Visual Memory

Use this skill when the user wants to index, search, organize, or inspect local
photo and video libraries.

Prefer `media_index` when the user points at a folder that has not been indexed.
Prefer `media_search` for natural-language searches such as finding shots,
finished videos, thumbnails, archive images, or clips matching a description.
Prefer `media_search_by_image` when the user provides an image and wants visually
similar items. Use `media_describe` when the user asks what is in a specific
media file.

Return concrete file paths, timestamps when available, short reasons, and any
metadata returned by the tool. Do not invent matches when the tool returns none.

Do not upload local media to a cloud service unless the user explicitly asks for
that separate action.
