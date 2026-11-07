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
| `page_uuid` | Exact page UUID; only valid with `kind: "block"`. |
| `where` | Optional structured filter, described below. |
| `select` | Nonempty, unique field list. Default: `uuid`, `title`, `page_uuid`. |
| `output` | `rows` (default) or `count`. |
| `limit` | Integer 1-1000; default 50. |
| `cursor` | Returned cursor object, for row output only. Pass it unchanged. |

Selectable fields: `uuid`, `title`, `page_uuid`, `page_title`, `parent_uuid`,
`recycled`. Rows contain only selected keys; unavailable values can be null.
Select `uuid` whenever matches will need subsequent reads or approved writes.

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

### Text lookup

```json
{
  "kind": "block",
  "where": {"field": "title", "op": "contains", "value": "meeting"},
  "select": ["uuid", "title", "page_uuid"],
  "limit": 20
}
```

### Empty linked blocks on an exact page

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
