# Logseq Skills

Reusable agent skills and client instruction packs for the native Logseq MCP server and Logseq 2.x DB graphs.

## Skills

- [`skills/logseq-db/`](skills/logseq-db/README.md) covers native DB-graph reads, writes, identifiers, verification, embeds, and recovery.
- [`skills/logseq-db-structure/`](skills/logseq-db-structure/SKILL.md) covers heading hierarchy, content placement, deduplication, and embeds.
- [`skills/logseq-db-import-repair/SKILL.md`](skills/logseq-db-import-repair/SKILL.md) covers migration diagnosis, legacy tag-versus-backlink recommendations, and cautious repair.

Install a skill using the skill mechanism supported by your agent client. Keep Logseq behavior in the skills; put client-specific activation and instruction files under `instructions/<client>/`.

## Target

These skills target the MCP server built into Logseq Desktop. They assume native tools such as `createEmbed` and `listEmbeds` are available; they are not written for the separate Python `mcp-logseq-db` server.

## Build

From PowerShell, run:

```powershell
.\build-skills.ps1
```

The script creates or replaces one ZIP per skill folder inside `skills/`.
Each ZIP contains that skill's `SKILL.md` at its root and includes any
references bundled with the skill, such as `skills/logseq-db.zip` and
`skills/logseq-db-import-repair.zip`.
