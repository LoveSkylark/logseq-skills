# Logseq DB Structure Instructions

Use these instructions when deciding how information should be modeled and organized in a Logseq 2.x DB graph. They describe content and graph structure, not operational procedures.

## Required outline shape

Treat the page as the root of a tree. Heading level and block parentage must agree:

- H1 is a direct child of the page.
- H2 is a child of the nearest preceding H1 that owns it.
- H3 is a child of the nearest preceding H2; apply the same rule to deeper heading levels.
- Put prose and other content under the narrowest heading it belongs to. Text before a nested heading remains under the enclosing heading. Do not leave section content beside its heading or directly on the page unless it is deliberately page-level content.
- Do not invent headings to fill skipped levels. Attach a skipped-level heading to the nearest preceding broader heading and preserve its source heading level when known.
- Heading markers and outline nesting are separate: keep `#`/`##`/`###` so Logseq renders the native heading, and indent/nest the block under its owning header.

Example:

```text
Page
- # Overview
  - Introductory text
  - ## Design
    - Design description
    - ### Storage
      - Storage details
  - ## Operation
    - Operational details
```

## Choose the graph entity

Use a page for a durable subject that has its own identity and should be linked to, opened, or managed independently. Use blocks for narrative, evidence, and nested material that belongs to a page or section; do not create a page for every heading.

Use a tag as a shared type/class for entities with the same conceptual shape. In a DB graph, a tag is schema, not just a label: it can declare property slots or cause native behavior. Use properties for typed facts that need to be filtered, sorted, or queried. Use a reference-typed property such as `node` when the relationship itself must be queryable; text containing a page title is not a graph relation.

Prefer an existing concept or schema over a near-duplicate. Titles are labels, not identity; distinguish separate meanings even when their names are similar.

Choose property type and cardinality as part of the model. Use a single-valued field when there is one current value, and a multi-valued field when several values are meaningful. A small closed set of categories may fit a tag/class better than a property used only to hold labels. Use typed entity relationships when those relationships are meaningful; text that resembles a title is not itself a graph relation. Built-in and system-owned schemas may be fixed, so model against the properties the graph supports.

Use a page relationship for narrative navigation, a typed property for a structured queryable relation, and one canonical block plus embeds when identical content belongs in several sections.

## Maintain the tag catalog

For the requested graph scope, keep a running tag catalog in the modeling plan or response. Track each category's name, definition, count of distinct member entities, representative examples, shared properties or behavior, and status: `existing`, `proposed`, `approved`, or `deferred`. Return the updated catalog when reviewing new content. A proposal is not an approved or implemented tag.

Suggest creating a new category tag only when at least **three distinct entities** of the same meaningful type exist in scope and the grouping will be useful and stable. Three is a minimum, not an automatic reason to create a tag. Count unique entities, not mentions, repeated appearances, or multiple blocks about one entity. If the count or meaning is uncertain, mark it `deferred` and ask rather than guessing.

Apply the threshold only to new-tag suggestions. Do not suggest removing, merging, or deleting an existing tag just because it has fewer than three members. Preserve sparse existing tags unless the user separately asks for a cleanup review.

For an RPG graph, consider categories such as Locations, Characters, NPCs, Items, and Quests. Avoid redundant subtype tags: if NPCs are simply Characters distinguished by a role, prefer a Character category plus a role field unless at least three NPCs form a genuinely distinct useful grouping with shared properties or behavior.

### Tag names and similar categories

- Page names take priority over tag names. If a durable page needs the title `Location`, keep that exact page title and suggest a distinct, short category tag such as `Loc`. Record in the catalog that `Loc` means the full `Location` category; do not rename or abbreviate the page to preserve the tag name.
- You may suggest merging existing tags only after comparing their meanings, members, properties, and behavior. Recommend a merge when the tags are truly synonymous or differ only accidentally, such as a spelling variant. Do not merge a subtype, role, region, or other meaningful distinction just because the labels look alike.
- Present a merge as a proposal: name the canonical tag, possible redundant tags, affected member groups, and any distinction that might be lost. Ask for approval before consolidation. The three-entity threshold applies to new-tag suggestions only; it does not justify merging or removing an existing sparse tag.

## Reuse repeated content

Represent repeated facts once. Keep one canonical content block under the most appropriate heading, then use Logseq embeds to display that block under other headings. An embed is a linked view, not a copy.

Merge exact duplicates and paraphrases only when they have the same facts, scope, conditions, and provenance. Do not merge merely related content. Preserve unique dates, exceptions, sources, qualifications, and context; if a merge would erase meaning, keep distinct content or canonicalize only the shared fact. Display the canonical content itself rather than unrelated surrounding sections. Keep section-specific explanation beside the shared content.

Preserve existing content identity and context when reorganizing. Avoid cyclic embed relationships; if the source and destination cannot form a coherent acyclic structure, place the shared content at an appropriate common location or keep it distinct.

## Plan the structure

1. Identify the graph's purpose, audience, and source material. Separate durable subjects, narrative, classifications, and queryable facts.
2. Draft the heading tree first. H1 begins a top-level section; each lower-level heading belongs below the nearest preceding heading that contains it.
3. Assign every passage to the narrowest section it supports. Content before a nested heading remains under its enclosing section; content after it belongs to the nested section until the next peer or ancestor heading.
4. Distinguish duplicate facts from related facts. Choose a canonical location for truly shared information and preserve qualifications or explanations that are local to one section.
5. Choose pages, blocks, classifications, fields, and relationships based on their meaning, not their visual appearance.
6. Review for orphaned content, artificial depth, repeated facts, conflicting definitions, and relationships that should be navigable or queryable.

## Plan multi-entity imports

Build a coherent model before populating it:

1. Decide which subjects need durable independent identity.
2. Define shared classifications and fields before assigning them to entities. Keep the class concept separate from the values of its properties.
3. Decide which relationships are narrative references and which should be typed, queryable relations.
4. Lay out the complete hierarchy at meaningful depth. Avoid nesting that has no semantic purpose.
5. Associate each classification and value with the entity it describes; keep schema, values, and narrative content distinct.
6. Review sibling order, section ownership, repeated concepts, and canonical meanings.

Prefer broad, readable outlines over artificial depth. Represent identical content once; use embeds for genuine reuse, and preserve distinctions whenever they affect meaning.
