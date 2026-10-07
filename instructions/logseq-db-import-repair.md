# Logseq DB Import-Repair Instructions

Use these instructions to diagnose renderer crashes or suspicious content in a Logseq 2.x DB graph through the native Logseq MCP. Preserve content, block identity, properties, and order. Do not rebuild a page to work around a crash.

## Establish the symptom

- Ask which exact page fails, what the user sees, and whether it fails after a full Logseq restart. Confirm the problem in the UI before changing data. MCP cannot return the renderer's JavaScript stack trace, and a successful query does not rule out a renderer crash.
- A normal `pageStats` or `findOrphans` result is not proof that a crashing page is healthy. Conversely, a nonzero orphan count is not itself a symptom: it can describe a harmless difference between `:block/page` and `:block/parent`.
- Read the affected page and identify exact block UUIDs before proposing a repair. Use `inspectPage(page_uuid, detail="blocks")`, `getBlock`, and `getBlockTree` as needed. Keep a short ledger of target UUID, observed state, suspected cause, proposed edit, and verification.

## Non-negotiable repair rules

- Preserve the original page structure, wording, block UUIDs, properties, and order wherever possible. Never use `importPage(replace=true)` to respond to a crash; it destroys block UUIDs and can break references.
- Do not delete visible content just because it participates in a suspected bug. Use `updateBlock` to repair text in place when possible. Use `removeBlock` only for a confirmed invisible, purposeless stub, and confirm before deleting any block or subtree.
- Explain any mutation and obtain confirmation before destructive repairs or moving real content to a scratch page. Do not acknowledge reference, alias, tag, or property loss without explicit user approval.
- Require `verified: true` after each write. On timeout or a failed read-back, inspect the actual graph before retrying; the operation may already have landed. Never repeat an ambiguous write blindly.
- Do not move blocks just to fix `findOrphans` or `pageStats.true_orphans`. Logseq renders from `:block/parent`, and moving content can alter order without resolving a visible fault.

## Review legacy tags versus backlinks

Logseq OG often used tags and backlinks for similar mention or navigation purposes. Logseq DB distinguishes them: a tag assigns a class/category to an entity and may declare properties or behavior; a backlink points to a specific page. Never convert all legacy tags mechanically.

Make recommendations first; do not write during the audit. Review each use in context because one tag name can classify one block and refer to a page in another. Read the imported blocks and UUIDs, inspect representative uses, and check candidate pages/tags when available. Do not decide from spelling, capitalization, or frequency alone.

### Build the recommendation report

1. Confirm scope with the user: specific pages, an import batch, or the whole graph. Do not silently widen the audit.
2. Read every block in scope and record its UUID plus surrounding heading/text. Distinguish `{{tag:Name}}` placeholders from tags already attached as DB relations. For stored relations, use `getTag` and `getTagUsers`; a textual marker and a class relation are not the same thing.
3. For each candidate, check for a unique destination page with `getPageUUID` and an existing tag with `getTagUUID`. To preview unresolved tag placeholders, use `repairLinks(page_uuid=..., include_tags=true, dry_run=true)`. This returns names, not every occurrence location, so correlate it with the block inventory. A write with `include_tags=true` processes every tag placeholder on the page, not selected names or blocks.
4. Return one row per meaning/use group. Include representative UUIDs, surrounding context, any candidate page, the recommendation (`convert to backlink`, `keep as tag`, or `unclear`), rationale, and confidence. Split a tag name into separate rows when its uses have different meanings. A matching page does not, by itself, justify conversion.

- Recommend **convert to backlink** when the marker refers to a specific page, concept, person, or source and the intended destination is a unique page.
- Recommend **keep as tag** when it consistently classifies an entity (type, role, state, workflow, or reusable category), particularly if the tag has declared properties or native behavior.
- Recommend **unclear** when context is insufficient, the term could be either a category or page reference, or titles are ambiguous. Ask the user rather than guessing.

Return a table with one row per meaning/use group, including the legacy tag, example block UUIDs and context, candidate page, recommendation, rationale, and confidence. Show proposed conversion separately from its approval status.

### Apply only approved rows

1. Resolve the intended page with `getPageUUID`; inspect the tag with `getTagUUID`/`getTag` when needed. Stop if the page is missing or ambiguous. Creating a page requires separate user approval.
2. For imported text placeholders, change only approved occurrences from `{{tag:Name}}` to `{{link:Name}}` with `updateBlock`. Preserve other occurrences of that tag. Before import, author approved page references as `[[Name]]`; `importPage` turns them into link placeholders.
3. For approved backlink placeholders, run `repairLinks(page_uuid=..., dry_run=true)` and review exact resolved, missing, and ambiguous names. The default `include_tags=false` resolves links while leaving tag placeholders inert. A dry run intentionally returns `verified: false` because it writes nothing; judge it by the resolution results. Leave `create_missing` off unless page creation is separately approved.
4. Apply only approved link placeholders with the scoped `repairLinks` call. Require `verified: true`, check `blocks_updated` and an empty `unverified` list, then read back representative blocks and confirm their `refs` target.
5. Do not write with `include_tags=true` until every tag placeholder on that page has a final approved `keep as tag` decision. The tool cannot restrict tag repair by name or block; it would also materialize any unresolved `unclear` placeholder. If decisions are mixed or unresolved, leave tag placeholders inert and report the limitation.
6. If the tag is already an attached DB relation, treat `removeTag(target_uuid, tag_uuid)` as a separate approved mutation: first add and repair the approved page-link placeholder, then remove only that relation. Removing a tag relation alone does not create a backlink. Never delete the tag definition globally; other entities may still use it.
7. Report verified conversions, kept tag uses, unclear cases, and partial results. On timeout or uncertain verification, inspect state before retrying.

## Known crash patterns

### 1. A heading whose only content is a wiki-link

A heading containing nothing but a single wiki-link has reproduced the DB renderer crash, both for self-links and links to other pages. If the UI symptom is confirmed and the block matches this shape:

1. Read the block by UUID and record its content, parent, and heading level.
2. Use `updateBlock` to replace the heading's linked text with short plain descriptive text. Keep the markdown heading marker (`#`, `##`, and so on) if it should remain a heading; the parser stores the heading level as a built-in property.
3. Read the same UUID again. Confirm its parent and heading level remain, the text is the replacement, and the `refs` edge for the heading-only link is gone.
4. If the link's information still matters, add it back as an ordinary sibling or child block, not as the entire content of a heading.

### 2. An empty block with a raw `:block/link`

An empty block can retain a raw link edge after a legacy block-reference/embed was cleared. It may be a dangling migration artifact, but an empty title alone does not prove that it is junk: native embeds are linked views with their own UUIDs and can also have empty titles.

1. Call `listEmbeds` for the block's owning page and compare the suspect block UUID with returned embed UUIDs. The page filter is not recursive; inspect the actual owning page. Check `truncated` and increase the limit if needed. A listed embed is legitimate linked content unless the user explicitly wants that embed removed.
2. If it is not a listed embed, inspect the page with `inspectPage(detail="properties")`. Look for `property.ident == "link"`; then call `getBlock` on each candidate to confirm the exact block, its empty content, and link metadata. `listEmbeds` is not a query for every raw `:block/link` value.
3. Remove only a confirmed invisible, dangling, purposeless stub. Pass the stub's UUID to `removeBlock`; never remove its visible parent or the linked target. Read back and confirm the stub is absent and its parent remains intact.

## Bisection when the cause is unknown

Only bisect if the user approves moving existing content. A move is diagnostic, not a repair, and is not atomic.

1. Record the page UUID, all top-level block UUIDs, and their original order. Keep the record outside the graph so it survives app restarts.
2. Create a disposable scratch page and a landing block. Move about half of the suspect page's top-level blocks to it with `moveBlocks(..., placement="last-child")`, preserving the supplied order. The tool is capped at 50 blocks per call and can stop partway; inspect every per-block verdict and `order_preserved` before continuing.
3. Ask the user to fully quit and relaunch Logseq, then check whether the original page still crashes. If it does, narrow the half that stayed; if not, narrow the moved half. Continue until one block is isolated and the symptom follows that block in a controlled test.
4. Apply the smallest repair from the known patterns. Do not leave suspect content on the scratch page.
5. Restore all moved blocks to the original page in the recorded order. `all_or_nothing` is only a partial remedy: it cannot restore original positions. Verify every move and the final outline; do not assume rollback succeeded.
6. Recheck the repaired UUID and affected page. Confirm the original content is back and the UI no longer crashes after a full restart. Only then, with approval, recycle the scratch page.

`pageStats.true_orphans` and `findOrphans` are informational during this workflow. Never interpret their count alone as evidence that a block is missing or damaged.
