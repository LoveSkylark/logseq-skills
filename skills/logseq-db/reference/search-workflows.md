# Native entity search

Use `findEntities` for structured matching and exact counts. It is a dedicated
read-only MCP tool, not `datascriptQuery`, and does not require that tool's
query approval form. Searches do not authorize mutations of their matches.
Do not call the underlying `logseq.DB.*` API directly.

## Arguments

| Argument | Contract |
| --- | --- |
| `kind` | Required: `page` or `block`. |
| `state` | `live` (default), `recycled`, or `all`. |
| `name_source` | `title` (default), `alias`, or `both`. Alias/both matching is page-only. |
| `page_uuid` | Exact page UUID; only valid with `kind: "block"`. |
| `where` | Optional structured filter, described below. |
| `select` | Nonempty, unique field list. Default: `uuid`, `title`, `page_uuid`. |
| `output` | `rows` (default) or `count`. |
| `limit` | Integer 1-1000; default 50. |
| `cursor` | Returned cursor object, for row output only. Pass it unchanged. |

Selectable fields: `uuid`, `title`, `page_uuid`, `page_title`, `parent_uuid`,
`recycled`, `aliases` (pages only), `matched_names`.
Rows contain only selected keys; unavailable values can be null.
Select `uuid` whenever matches will need subsequent reads or approved writes.
Alias and matched-name details are fetched only when selected.

## Filters

Only these strict forms are supported; do not invent regex, raw attribute,
tag UUID or property-ident filters:

```json
{"field":"title","op":"empty"}
{"field":"title","op":"equals","value":"Overview"}
{"field":"title","op":"contains","value":"meeting"}
{"field":"title","op":"starts_with","value":"Project"}
{"field":"has_children","op":"eq","value":true}
{"field":"has_link","op":"eq","value":true}
{"field":"position","op":"eq","value":"first_outline_child"}
```

`position` is block-only. Title matching is literal and case-sensitive; do
not assume fuzzy or regex behavior. A missing or non-page `page_uuid` is an
error, not an empty result. `has_link` tests a link edge, not whether text contains a
wiki-link. It does not prove that an empty linked block is a dangling stub:
inspect embed metadata and the target before proposing removal.

Combine filters with nonempty `{"all":[...]}` or `{"any":[...]}` groups.
Maximum filter depth is 4, maximum nodes 32, and title literals are limited
to 1024 characters.

## Alias-aware page lookup

Check the connected tool's advertised schema before using `name_source`,
`aliases` or `matched_names`; an older Desktop build may not expose them.
These are additions to `findEntities`, not a separate lookup tool or permission
to bypass MCP through the native API.

- `name_source: "title"` preserves existing title-only behavior.
- `"alias"` tests the names the result page declares as aliases; `"both"`
  tests its own title as well. Title operators remain literal and
  case-sensitive. One candidate name must satisfy the whole filter; an `all`
  filter cannot combine part of one alias with part of another. Structural
  predicates still describe the result page.
- Each row's `uuid` and `title` identify the declaring page, not the alias
  entity. Counts and pagination deduplicate pages even when several aliases
  match. If several pages claim a name, keep them as separate candidates and
  ask the owner before choosing an ambiguous write target.
- `matched_names` contains `{uuid,title,source,recycled}` records, where
  `source` is `title` or `alias`. An alias record's UUID identifies the alias
  entity; use the outer row's UUID for the declaring page. `aliases` contains
  all declared `{uuid,title,recycled}` names allowed by the state policy,
  regardless of which name matched.
- `state` filters result pages, including inherited recycling. Live searches
  also exclude recycled alias names; recycled/all searches allow either state
  of alias names. Select `recycled` to distinguish result states and do not
  restore anything automatically.
- Only direct current and legacy alias relations are followed, not recursive
  alias chains. A title-only match on an alias page returns that page itself,
  not an implicit redirect. Matching is not a universal availability check.
- `kind` is still only `page` or `block`; alias matching and `aliases`
  selection do not add tag, property or journal kinds. Use their dedicated
  tools when needed. Alias relations remain outside MCP's writable properties;
  the separate `suggestLinks` tool below proposes links without inserting them.

Find declaring pages by an exact alias, retaining enough evidence to review
the target:

```json
{
  "kind": "page",
  "name_source": "alias",
  "where": {"field": "title", "op": "equals", "value": "Alpha"},
  "select": ["uuid", "title", "matched_names"]
}
```

Use `"both"` for title-or-alias lookup. For several input names, combine title
`equals` predicates with `any`, select `matched_names`, and associate returned
names with those inputs; do not assume one row per input or a unique target.

For a graph-wide alias inventory, omit `where`:

```json
{
  "kind": "page",
  "name_source": "alias",
  "select": ["uuid", "title", "aliases"],
  "limit": 50
}
```

This lists only pages with qualifying aliases. Title mode with the same
selection also includes pages with no aliases, returning `aliases: []`.
Follow `next_cursor` before claiming the inventory is complete. Nested name
records share the 65536-byte response cap; an oversized single row errors,
rather than silently returning a partial alias list. Select fewer fields if
needed, and do not describe an omitted alias list as complete.

## Draft link suggestions

On builds advertising `suggestLinks`, use it to identify potential links in
supplied draft text, not to search existing block content:

```json
{"text":"Project Alpha needs a review.","limit":20}
```

It reads live page titles and aliases through `findEntities`, matches literal
case-sensitive whole names, and skips common existing links, tags, URLs,
macros/embeds and inline/fenced code. Masking is conservative, not a full
Markdown/Logseq renderer. Leftmost non-overlapping spans win, with the longest
name preferred at the same start.

Read `suggestions` entries as `{start,end,text,candidates,ambiguous}`.
Offsets are UTF-16 code units with an exclusive end; JavaScript
`draft.slice(start,end)` must equal the returned text. Candidates contain the
target `uuid`, `title` and `matches: [{source,name_uuid}]`, where source is
`title` or `alias`. Multiple targets remain ambiguous; an alias page's own
title can itself be a candidate, not an implicit canonical redirect. Review
targets rather than choosing the first.

Drafts are limited to 20000 UTF-16 units. `limit` defaults to 20, maximum 100.
`count` is the number returned; `total_spans` is the pre-truncation
non-overlapping span count. Check `truncated`: response limits can omit later
spans, never candidates within a returned span. There is no cursor; use a
smaller draft if needed. Scan limits are 10000 live pages, 50000 name records
and 8 MiB of inventory; raw matches cap at 10000 and output at 65536 UTF-8 bytes.
Blank names and names longer than 1024 units are not suggested. Exceeded scan
caps or changed graph names produce errors, not incomplete ambiguity reports.

Returned names are reread before reporting, but suggestions are still not
permission to write. Ask the owner about ambiguous destinations and obtain
normal write authorization before applying anything. If the draft has changed,
rerun rather than applying stale offsets. Any approved graph write must use
the existing verified tools and preserve surrounding content and structure.

## Text lookup

```json
{
  "kind": "block",
  "where": {"field": "title", "op": "contains", "value": "meeting"},
  "select": ["uuid", "title", "page_uuid"],
  "limit": 20
}
```

## Empty linked blocks on an exact page

Replace the example UUID with the resolved owning page UUID:

```json
{
  "kind": "block",
  "page_uuid": "00000000-0000-4000-8000-000000000001",
  "where": {
    "all": [
      {"field": "title", "op": "empty"},
      {"field": "has_link", "op": "eq", "value": true}
    ]
  },
  "select": ["uuid", "title", "parent_uuid", "page_uuid"],
  "limit": 50
}
```

Use `getBlock` and `listEmbeds` to classify each result. This is an inventory,
not a cleanup instruction; empty titles can belong to legitimate embeds.

## Counts and pagination

The envelope contains `output`, `matches`, `count`, `count_is_exact`,
`truncated`, `next_cursor`, and `limits`.

- Row mode: `count` is the number returned, not the graph total;
  `count_is_exact` is false. Rows are ordered by internal entity ID, not
  outline order. Read/sort `:block/order` through appropriate block tools
  when reconstructing an outline.
- Count mode (`output: "count"`): `count` is the exact total, `matches` is
  empty, `count_is_exact` is true, `truncated` is false, and `next_cursor`
  is null. Do not pass a cursor.
- Row output is bounded by the requested limit and 65536 UTF-8 bytes. Check
  `truncated`; continue using the returned `next_cursor` with unchanged
  search parameters. Its `after_id`, `basis_rev`, and `fingerprint` are
  opaque paging state, not durable entity identities.
- A row too large for the byte cap causes an error: request fewer fields.
  Graph mutation or a cursor from another graph/search causes an explicit
  error; restart without a cursor and do not silently combine incompatible
  snapshots.

Output limits and filter bounds do not bound DB scan time. Scope to the
requested page when possible and avoid repeated graph-wide scans.

## Other inventories are not cursor searches

`listPages` accepts only optional `expand` and returns an unpaginated
inventory. Do not pass `with_counts`, `limit`, or an offset to it.
Use `pageStats` for selected pages' counts.

`listJournals` separately supports `with_counts` and `limit`; counted mode
defaults to the first 500 journals and has no offset or continuation cursor.
A truncated counted listing is not complete graph evidence. Use
`findEntities` for paged page identity discovery when appropriate, not an
invented listing pagination argument.

## Simple native search

`searchBlocks` accepts only:

```json
{"searchTerm":"meeting"}
```

It rejects blank terms and filters native search candidates to case-sensitive
literal title matches, returning `blocks` in the native envelope. Native
candidate limits remain unchanged; it is not an exhaustive graph scan.
There are no MCP `regex`, `page_uuid`, or `limit` arguments and no exact-total
promise. Use `findEntities` when scope, completeness or counts matter.

## Graph health observations

Use `getGraphHealth` only when advertised by the connected server:

```json
{"sample_limit":5}
```

`sample_limit` defaults to 5 and must be an integer from 1 to 20. Optional
`checks` is a nonempty unique list that **replaces** the defaults. Optional
`page_uuids` scopes only the two page audits below; it requires those checks
and 1-100 unique live Page-class UUIDs. Other selected checks stay graph-wide.
There are no repair, raw-query, convention or pagination arguments.

The tool returns only selected `checks`, `checks_run`, `title_entities_scanned`
(null when unused), actual audited `page_uuids` (null without page audits),
`consistency`, `limits`, and `diagnostic`. Each check has `count`, bounded
`examples`, and `truncated`. Default checks:

- `duplicate_titles`: exact, case-sensitive, nonblank Page/Tag-class title
  groups, including recycled entities. `count` counts groups; `entity_count`
  counts all group members. Each example includes `title`, `entity_count`,
  sampled `entities` (`uuid`, `kind`, `recycled`), and a member `truncated`
  flag. The recycled flag reflects directly stored deletion, not inherited
  state. There is no alias/content/reference classification or merge ranking.
- `tags_without_holders`: native tags with no direct `:block/tags` holders.
  Examples retain available UUID/title/ident. Other references and child tags
  can exist; this is not a deletion-safety check.
- `properties_without_values`: qualified namespaced property attributes with
  no stored values. Examples include `ident`, `title`, and `type`; declarations
  alone do not count as attribute values.
- `alias_ambiguity`: exact, case-sensitive nonblank live page titles/direct
  aliases shared by multiple declaring pages, with at least one alias match.
  Pure title duplicates remain in `duplicate_titles`. `count` counts ambiguous
  names, `names_examined` distinct names. Examples retain name, candidate count,
  sampled declaring-page UUID/title and sampled title/alias evidence with
  source/name UUID. Check candidate and evidence truncation; no target is chosen.
  The alias carrier's own title is not a separate competing declaration.
  Multiple declaring pages and unrelated same-title pages still count.
  This health-only filtering does not change `findEntities` or `suggestLinks`.
- `unresolved_placeholders`: remaining complete literal `{{link:NAME}}` and
  `{{tag:NAME}}` markers in live ordinary blocks. `count` counts block/kind/name
  combinations, `block_count` affected blocks, `occurrence_count` all markers.
  Examples include block/page UUIDs, kind/name, occurrences,
  `resolution` (`missing`, `resolvable`, `ambiguous`), candidate count and
  sampled candidates. Resolution is exact Page/Tag-class title matching, not
  alias matching, using directly stored recycling from title inventory.
  Resolvable markers still count as unconverted placeholders. Code/examples
  are not masked; malformed/unclosed markers are not counted. This is not a
  general broken-link detector or write-time target verification.

Opt-in audits:

```json
{
  "checks":["empty_pages","page_ownership_mismatches"],
  "page_uuids":["00000000-0000-4000-8000-000000000001"]
}
```

- `empty_pages`: live pages with zero native content blocks, inbound
  refs/tag holders/property-value counts, and no alias relationship in either
  direction. Own/seeded empty blocks do not establish content. This is a
  candidate report, not deletion permission.
- `page_ownership_mismatches`: structural descendants whose stored page UUID
  differs from the nearest structural page ancestor. Nested pages, including
  recycled pages under Recycle, establish their own ownership boundary. `count` counts
  page/block pairs; `distinct_block_count` deduplicates blocks across audits.
  Examples contain audited, block, stored-page and `expected_page_uuid` UUIDs.
  Missing stored-page UUIDs are excluded; incomplete/cyclic ancestry errors.
  Blocks can still render correctly. Do not move blocks merely to reduce a count.
  The separate `findOrphans` tool is unchanged.
- `references_to_recycled`: directly recycled pages/blocks with inbound
  backlink/tag-holder/property-value rows. `count` counts targets,
  `targets_scanned` all direct recycled entities, and `reference_count`
  relation rows, not unique referrers. Examples contain target UUID/title
  and sampled reference/holder/property summaries. Referrers may also be
  recycled. Recycle original-page/original-parent property bookkeeping is
  excluded; genuine self-links and built-in view references still count.
  Inherited-only recycling is not inventoried; this is not proof of broken links.
- `invalid_choice_values`: holder/value rows on reference-valued properties
  that are not IDs of that property's directly non-recycled declared choices.
  Examples contain property ident, holder, raw value and resolved entity
  summary. Compares identity, not labels. Review `properties_scanned`,
  `unchecked_property_count`, sampled `unchecked_properties`,
  `unchecked_properties_truncated`, and `validation_complete` (false if any
  property storage was unsupported). Non-reference storage is not guessed.
  Properties without choice definitions, class-scoped choices/exclusions,
  inherited choice recycling and general type/schema rules are not validated.
  The server alone requests opt-in native choice metadata; ordinary
  `listClosedValues()` retains its original response.

Built-in and recycled definitions are not excluded from the orphan checks.
Counts remain complete per inventory/scope when examples are truncated;
choice-validation coverage is explicitly limited as above. Nested members,
candidates, alias evidence, reference rows and unchecked-property examples
also have sampling/truncation indicators.
There is no sample cursor; use detailed tools to investigate omitted rows.
`consistency: "independent_reads"` means no atomic graph snapshot is promised.

Inventories must fit 10000 rows, including accumulated entity-search pages;
name records are capped at 50000, distinct placeholder rows at 10000.
Per native response: 8 MiB; total: 32 MiB/400 calls. Fan-out is capped at 100
audited pages (scope with `page_uuids`), 100 directly recycled targets, and 50
choice properties. Otherwise use targeted detailed tools rather than treating
an error as a partial pass. These are MCP caps, not native execution/scan/
transfer limits; native search cursor/byte errors propagate. Cap violations, malformed
inventories and API failures error the entire report, never return partial
counts or zero-shaped fallbacks. The response cap is 65536 UTF-8 bytes; lower
the sample size or use detailed tools if exceeded.

Do not call these observations damage or use them as cleanup authorization.
Zero counts do not certify graph health. Missing summaries/tags, local asset
availability, lost embed targets and general schema validation are not checked.
Use `findDuplicateTitles`
for content/reference/alias evidence, `listOrphanTags`/`listOrphanProperties`
for full inventories, and `findBacklinks`, `getTagUsers`, or `getProperyUsers`
for usage before proposing owner-approved changes. Do not bypass MCP with the
underlying native APIs. Live Desktop verification remains pending.
