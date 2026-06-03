# Security

This integration is local-first. Mneme indexes files on the machine where the MCP
server runs and stores metadata in a local database.

## Local Data

Do not commit:

- Media folders.
- Index databases.
- Auth files.
- Private skills.
- Generated logs.

The repo `.gitignore` blocks common local artifacts, but contributors should
still review `git status` before committing.

## File Access

OpenClaw can only search media that Mneme has been pointed at. Treat indexed
paths as sensitive metadata because file names and folder names can reveal
private project details.

## Cloud Use

This package does not upload media by default. If a user combines it with a
cloud model or another tool, that separate tool's privacy posture applies.
