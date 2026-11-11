# Logseq Skills

Reusable agent skills and client instruction packs for the native Logseq MCP server and Logseq 2.x DB graphs.

## Skills

- [`skills/logseq-db/`](skills/logseq-db/README.md) covers native DB-graph reads, writes, identifiers, verification, embeds, and recovery.
- [`skills/logseq-db-structure/`](skills/logseq-db-structure/SKILL.md) covers heading hierarchy, content placement, deduplication, and embeds.
- [`skills/logseq-db-import-repair/SKILL.md`](skills/logseq-db-import-repair/SKILL.md) covers migration diagnosis, legacy tag-versus-backlink recommendations, and cautious repair.
- [`extensions/claude-desktop/`](extensions/claude-desktop/README.md) contains the Windows/macOS Claude Desktop `.mcpb` installer, source, and step-by-step setup guide (separate from the skill ZIPs).

Install a skill using the skill mechanism supported by your agent client. Keep Logseq behavior in the skills; put client-specific activation and instruction files under `instructions/<client>/`.

## Target

These skills target the MCP server built into Logseq Desktop for DB graphs. Native Logseq source, SDK, tests and advertised tool schemas are authoritative. They assume native tools such as `createEmbed` and `listEmbeds` are available.

The current guidance reflects structured, alias-aware `findEntities` search, literal native
`searchBlocks` filtering, stricter import/read-back verification, and safe
recycled-title archiving. These are source-reviewed contracts, not a claim that
the connected desktop app has been rebuilt or live-tested. Check advertised
schemas and `capabilities` on that app before relying on them.

Alias-aware page search uses `name_source` and opt-in `aliases`/`matched_names`
fields on builds exposing them. It supports paginated alias discovery while
preserving ambiguous targets; it does not add alias writes. Live Desktop alias
verification remains outstanding. The separate read-only `suggestLinks` tool
proposes title/alias links in drafts with exact spans and explicit ambiguity;
it does not insert links. Check the advertised tool schema before using it.

The read-only `getGraphHealth` tool, when advertised, reports counts and bounded
examples of exact duplicate page/tag titles, tags without direct holders and
properties without stored values, live alias ambiguity and literal import
placeholders by default. Optional check selection adds bounded page,
recycled-reference and choice-membership audits, with explicit coverage limits
and unchecked-property reporting. It gives no health verdict or cleanup
authorization; built-ins, recycled entities and other references can explain
findings. Local fixtures are verified; live Desktop validation remains pending.

The latest documentation review also clarifies unpaginated `listPages`,
counted-journal limits, literal block updates versus heading-aware imports,
MCP reference-value shapes, and the known case-variant page-creation defect.
The native E2E checklist records no live passes; written procedures and local
fixture tests must not be reported as actual graph/UI verification.

Source documentation in the sibling checkout:

- [Native MCP tool contracts](../logseq/docs/mcp-native-tool-map.md)
- [Native regression checklist and remaining verification gaps](../logseq/docs/mcp-native-e2e-test.md)
- [Native MCP implementation notes](../logseq/docs/mcp-native-migration.md)
- [Desktop HTTP DB API reference](../logseq/docs/native-db-api.md) (a different interface, not an MCP schema)

## Build

From PowerShell, run:

```powershell
.\build-skills.ps1
```

The script creates or replaces one ZIP per skill folder inside `skills/`.
Each ZIP contains that skill's `SKILL.md` at its root and includes any
references bundled with the skill, such as `skills/logseq-db.zip` and
`skills/logseq-db-import-repair.zip`.
