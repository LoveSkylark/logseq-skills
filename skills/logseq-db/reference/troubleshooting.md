# Troubleshooting

Read when a write reports `verified=false`, a call times out, or a structured
lookup fails. Results are tool-specific, not a universal failure envelope.

## Symptoms

| What you see | What it means | What to do |
| --- | --- | --- |
| `verified=false` | The requested state was not verified; this can be a no-op, partial write, failed read-back, or dry run. | Read `diagnostic`, any supplied before/after fields, and exact target state before deciding what to do. |
| `verified=false`, states differ | Something happened, but not what was asked. | Read the target fully before anything else. This is the more serious case. |
| MCP `isError: true` | A thrown exception or API error. Native handlers do not promise a `failure_stage` or structured error code. | Read the error text. If writes could have begun, inspect actual state before retrying. |
| `status: "conflict"`, `created: false`, `verified: false` | A live/non-page holder prevents page creation. This can be a transport-successful MCP result. | Inspect `held_by`; do not claim creation succeeded. |
| `archived_pages` in an unverified creation/import | Some recycled holders may already have been renamed before a later step failed. | Inspect those exact UUIDs and the requested title before retrying. |
| `createEmbed` verification failed or timed out | The embed may already have been created even though verification did not complete. | Inspect `listEmbeds` using the owning page and target UUIDs before retrying. |
| An embed has an empty title | Linked target content is not copied into the embed block's title. | Use `getBlock` or `listEmbeds` to inspect target metadata. Do not treat a confirmed embed as an empty placeholder or remove its target. |
| `"outside this caller's namespace"` | A property ident outside the native MCP caller's namespace. | Use only permitted MCP property tools; direct HTTP documentation is not permission to bypass them. |
| `deletePage` refuses with a reference count | Entities link to the page and those links are not rewritten. | Report the count to the user; only set `acknowledge_reference_rewrite` once they have decided. |
| A page "deleted" but still readable by UUID | Expected. Deleting recycles: the entity survives with `:logseq.property/deleted-at`. | Check `listPages` excludes it. Use `listRecycled` to see it. |
| A dry run succeeded but the real call failed | `dry_run` validates the PAYLOAD; the real call also validates the TRANSACTION. A graph carrying invalid entities passes the first and fails the second. | Never report a dry run as a completed change. |
| `pageStats` shows `own_blocks` well below `subtree_blocks`, or `true_orphans` above zero | Some blocks' `:block/page` points at an ancestor block. **Not damage** — Logseq renders from `:block/parent`, so they display normally. | Nothing. Do not move blocks to correct it; a move rewrites their order for no benefit. |
| A user says content is missing from a page | Check the page in the Logseq UI before believing any count. | A count disagreement is not evidence of missing content. Confirm the symptom first. |
| A tool call returns "no result received after 4 minutes" | The client stopped waiting; the server usually kept working and committed. | Do not retry blindly. Re-read state to see what landed. Bulk operations need a batch limit so each call returns in time. |
| Query results disagree with expectations | Syntax, inputs, scope, projection or truncation may differ; this alone does not establish corruption or a transport failure. | Inspect the actual envelope/errors. Parameterize strings/UUIDs. Any diagnostic `datascriptQuery` needs its own explicit approval. |
| `searchBlocks` returns `blocks: []` | No literal title match among the bounded native candidates, not an exhaustive graph zero. | Check spelling/case or use `findEntities` for structured/exact matching. |
| `findEntities` returns `truncated: true` | Row or byte bounds stopped the result. | Pass `next_cursor` with unchanged parameters; row `count` is not a total. |
| `findEntities` rejects a stale cursor or reports graph changes | Paging no longer refers to the same graph/search snapshot. | Restart without a cursor. Do not combine incompatible partial results. |
| A real transaction returns an EDN validation error after a successful dry run | Payload validation did not establish transaction success. The message alone does not identify a graph defect. | Read the error and affected state; do not bypass MCP or report a graph-wide limitation from one failed route. |
| A write works in the Logseq UI but fails through a tool | The method that tool routes through is failing, not the graph. | Try a tool that uses a different route before concluding anything about the data. |

## Before blaming the graph

Four separate diagnoses in one session — invisible blocks, a wedged DB worker,
dangling references, three corrupt entities — were all wrong. Each came from
reading an error message or a metric as a cause, and each survived several
exchanges because it was asserted rather than tested. The actual fault, every
time, was narrower and findable.

So when something fails:

**Try a different route before blaming the data.** `upsertNodes` failing said
nothing about the graph; `insertBlock` wrote to it fine. One alternate call
would have settled in seconds what several hours of inference did not.

**Ask what the UI shows.** It is the cheapest test available and it has been
right every time. "Can you do this in Logseq itself?" invalidates most
corruption theories immediately.

**Check the actual query result.** Inspect errors, inputs, `row_count` and
`truncated`; an empty or null result alone does not prove the request never
reached Logseq. A diagnostic query needs fresh approval, not silent retries.

**Do not trust a metric built on the attribute you suspect.** If
`own_blocks` is computed from `:block/page`, it cannot be evidence about
`:block/page`.

## Ambiguous writes

A timed-out write is **ambiguous**: Logseq may have applied it before the
connection dropped. Retrying could duplicate it. Native MCP does not advertise
the legacy standalone server's `writes_disabled` circuit; do not assume
later writes are automatically blocked.

Reads are how you find out what actually happened.

To recover:

1. Read the target and establish its real state.
2. If even a trivial read remains unresponsive, ask the user to save work and
   fully quit/restart Logseq, then reconnect MCP.
3. Re-read state before any further mutation; restarting is not a rollback.

Never work around this by reconnecting and repeating the write. Reconcile
first.

## Timeouts

Datascript predicates run inside Logseq's DB worker, so an expensive query can
wedge the worker while the MCP process stays healthy. Queries are
single-attempt for that reason: a query that timed out once will time out
again, and retrying doubles the load on something already struggling.

`findEntities` filters and approved `datascriptQuery` predicates can scan
the graph. Scope when possible; output caps do not cap worker execution.
Every `datascriptQuery` retry or revision needs fresh explicit approval.
For `findEntities` block searches, use
`page_uuid` when possible, and if the graph stops responding after a search,
the worker is the first thing to suspect — restart Logseq, not just the MCP.
Do not loop it over a list of words without checking the graph is still
answering in between.

If a trivial read also times out, stop mutations and investigate responsiveness.
A timeout alone does not establish that the DB worker is wedged.

A long UI freeze during a write usually means the same thing. Wait for the read
to succeed before assuming the write failed.

## Diagnosing a silent no-op

This is the characteristic failure, so it is worth recognising quickly.

The response is `null` or `{:block 1}` and nothing changed. Causes, in order of
likelihood:

**Wrong identifier type.** A property given a UUID instead of an ident. A tag
given its ident instead of its UUID. A block UUID where a page UUID belongs.

**A name where a UUID belongs.** Use the advertised MCP shape: entity targets
use UUIDs, property tools require exact namespaced idents, and reference values
may require a freshly read integer ID. `importPage.target` can be a title
for creation; that is not a general title-resolution rule for mutation fields.

**Assuming an API schema is an MCP schema.** Direct HTTP commands, option
maps and value-choice arrays are not MCP arguments. Check the connected tool.

**A normalized property definition.** Retain the canonical ident returned
by `createProperty`, not one constructed from its input title.

Read the target with `inspectPage(..., detail="all")` or `getBlock`, and
compare exact identity and state with what was requested.

## Escaping errors

`FST_ERR_CTP_INVALID_JSON_BODY` means the request body was not valid JSON and
Logseq never saw it. Usually a Datascript query with unescaped quotes — the
query travels as a string inside the JSON, so `#uuid "..."` must be
`#uuid \"...\"`.

If the query passed through a Logseq block on its way, that is the cause:
`#uuid` autocompletes into a tag reference (`#[[...]]`), and `[[`, `((`, `{{`
transform too. Use a code block.

The MCP tools build their own queries, so this only arises with hand-written
ones.

## Claims that need checking, not assuming

`capabilities` reports `unknown` when a probe was inconclusive. That is not
"unavailable" — try the tool and read `verified`.

Nothing here is guaranteed across Logseq versions. If
`graph.version_matches` is false, this build is not the one the tools were
verified against, and a behaviour difference is a plausible explanation for
anything surprising.

Read `basis` alongside tool `state`. Write probes default off; `not-probed`
does not mean the method is broken. Do not enable `probe_writes` on a real
graph merely to discover capabilities: obtain explicit approval and use a
disposable graph. Native schemas and fresh read-back evidence are authoritative,
not standalone-server scripts or environment-variable instructions.

## Verification is specific evidence

The current native E2E checklist records no live passes. It prescribes tests
on explicitly approved, fresh run-owned fixtures, not a completed run.
Separate source review, automated fixtures, and real graph/UI results.

- `verified` checks a tool's stated postconditions, not every field, renderer
  behavior, or the absence of all unrelated damage.
- Case-variant `createPage` can return an existing page as verified.
  Compare exact title and UUID with preexisting holders before reporting
  a new page.
- Counts do not prove heading/content/order preservation. Read affected
  UUIDs and confirm UI symptoms separately.
- Child-tag reparenting, advanced property schemas, and asset cases need
  their own fixtures; an unused-tag or simple-property test does not cover them.
- Never run write probes or destructive demonstrations on a user's real
  graph merely to fill a testing gap.

## A count is not a symptom

The worst failure this server has produced was not a bug in a tool. A repair
tool was built on the belief that blocks whose `:block/page` pointed at an
ancestor were invisible in the UI. The evidence was a metric — `own_blocks`
rising after a "repair" — computed from the very attribute that looked wrong.
It was circular, nobody opened a page to look, and roughly 1,500 blocks were
reordered before the premise was checked and turned out to be false.

So before repairing anything:

- Confirm the user can see the problem. A number is not a symptom.
- Check whether the metric depends on the attribute you suspect. If it does,
  it cannot be evidence about that attribute.
- Dump a raw entity with `[?e ?a ?v]` rather than trusting a shaped read.
  Responses strip namespaces and synthesise fields, so they do not describe
  the schema.

And when a diagnosis is challenged, re-derive it rather than restating it.
Three separate diagnoses in one session — invisible blocks, a wedged DB
worker, dangling references — were all wrong, and each survived several turns
because they were asserted rather than tested.
