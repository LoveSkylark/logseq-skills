# Client Instructions

This directory contains detailed, paste-ready instruction versions of the skills, plus a home for client-specific instruction packs.

## Plain Instructions

Use [`logseq-db.md`](logseq-db.md) or
[`logseq-db-import-repair.md`](logseq-db-import-repair.md) when an LLM client
cannot load skills. Paste the relevant document into that client's instruction
field. These guides target the native Logseq MCP server; the full skills in
`../skills/` remain the deeper reference.

Use [`logseq-db-structure.md`](logseq-db-structure.md) to enforce consistent
heading hierarchy and single-source embedded content when organizing a graph.

When adding a client-specific pack, create `instructions/<client>/` and document that client's instruction-file format, discovery location, and setup steps. Keep tool contracts and Logseq behavior aligned with the canonical skills. State which MCP server/tool surface each instruction pack assumes.

No client-specific instruction packs are included yet.
