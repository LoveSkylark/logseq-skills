---
name: logseq-db-structure
description: "Use when deciding how to model and structure content in a Logseq 2.x DB graph, especially heading hierarchy, page/block/tag/property roles, tag taxonomy, and repeated information."
---

# Logseq DB Structure

Use this skill to decide how information should be represented and organized in a Logseq 2.x DB graph. It describes the data model and content structure, not how to perform operations.

## Structural model

Treat each page as the root of an outline. Represent document heading hierarchy in both the native heading level and the block-parent tree:

- H1 blocks are direct children of the page.
- An H2 is a child of the nearest preceding H1 that contains it.
- An H3 is a child of the nearest preceding H2; continue the same rule for deeper heading levels.
- Place each prose, list, table, or code block under the narrowest heading it belongs to. Do not leave section content as a sibling of its heading or directly under the page unless it is intentionally page-level content.
- A section's text belongs under its own heading. Text preceding a nested heading stays under the enclosing heading.
- Do not invent missing headings. If a source skips a level, preserve its meaning and attach the heading under the nearest preceding broader heading; retain the source heading level when it is clear.

A heading marker alone does not create the parent-child relationship. Preserve heading markers (for example `#`, `##`, `###`) and also express the same nesting through outline depth.

Example shape:

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

Use the smallest entity type that matches the information's role:

- **Page:** a durable subject with its own identity that should be linked to, opened, or managed independently. Do not create a page for every heading.
- **Block:** narrative, evidence, notes, or nested material that belongs to a page or section.
- **Tag:** a shared type/class for entities that should have the same conceptual shape. A DB tag is schema, not just a visual label; it can declare properties or trigger native behavior.
- **Property:** a typed field used to filter, sort, or query facts. Use a reference type such as `node` when the relationship itself must be queryable; a text property containing a page title is not a graph relation.

Prefer an existing page, tag, or property over a near-duplicate. Treat titles as labels rather than identity: different entity types may share similar names, so choose one canonical concept and distinguish genuinely different meanings.

Decide property type and cardinality as part of the model. Use a single-valued field when an entity has one current value and a multi-valued field when several values are meaningful. A small closed set of categories may fit a tag/class better than a property whose only purpose is to hold labels. Use a typed entity relationship when the relationship itself is meaningful; storing a display name as plain text does not create a graph relation. Built-in and system-owned schemas may be fixed, so design around the properties the graph actually supports.

Use a page relationship for narrative navigation. Use a typed property for a structured relationship that should be queried as data. When the same content belongs in several sections, keep one canonical block and display it through embeds.

## Maintain a tag catalog

When reviewing or organizing a graph, keep a running tag catalog for the requested scope. The catalog is part of the modeling plan, not proof that a tag has been created or approved. Track each category's name, meaning, distinct entity count, representative entities, shared properties or behavior, and status (`existing`, `proposed`, `approved`, or `deferred`). Return the updated catalog when new content changes the counts or taxonomy.

### Resolve tag names and near-duplicate categories

- Give durable page names priority over category tag names. If a subject needs the page title `Location`, keep that page name; suggest a distinct, concise tag name for the category, such as `Loc`, and record that `Loc` means the `Location` category in the catalog. Do not shorten or rename the page to preserve a tag label.
- When two existing tags appear similar, compare their definitions, members, properties, and behavior before recommending a merge. Suggest merging only when they express the same category and the distinction is accidental (for example, spelling or synonymous labels). If one is a subtype, role, region, or other meaningful distinction, keep it separate or model the distinction explicitly.
- A merge is a proposal, not an automatic cleanup. Name the suggested canonical tag, the tags that may be redundant, the affected member groups, and any lost distinctions. Ask for approval before consolidating. The three-entity threshold applies only to proposing a new tag; it is not evidence for merging or removing an existing tag.

Suggest a **new category tag** only when at least three distinct entities of the same meaningful type exist in scope and grouping them provides a stable, useful classification. Three is a minimum, not an automatic reason to create a tag: the entities must genuinely share a conceptual shape. Count unique entities, not mentions, repeated appearances, or blocks that discuss the same entity. If the count is unknown, say so and defer the recommendation rather than guessing.

This threshold applies only to suggesting new tags. Never recommend deleting, merging, or removing an existing tag just because it has fewer than three members; preserve existing sparse tags unless the user requests a separate cleanup review.

For an RPG graph, review categories such as Locations, Characters, NPCs, Items, and Quests as candidates. If `Location` is required as a page title, keep the page name and use a tag such as `Loc` for the category; preserve the full meaning in the catalog. Avoid redundant subtype tags: if NPCs are simply Characters with a role, prefer a Character classification plus a role field unless at least three NPC entities form a genuinely distinct, useful class with shared properties or behavior. Keep the catalog's definitions clear enough that later content can be classified consistently.

## One source for repeated content

When the same information belongs in multiple sections, keep one canonical content block and use Logseq embeds to display it in the other locations. An embed is part of the graph's structure: it displays linked content rather than making another copy. Do not duplicate the same paragraph into multiple branches merely to make it visible in each place.

- Merge exact duplicates and paraphrases only when they express the same facts with the same scope, conditions, and provenance. Similar subject matter is not enough.
- Preserve unique qualifiers, dates, sources, exceptions, and context. If merging would erase a meaningful distinction, keep separate blocks. You may canonicalize the shared fact and leave the distinct details local.
- Choose the canonical location where the content is most authoritative and useful. Preserve the identity of existing canonical content when reorganizing.
- Display the canonical content block, not its containing header or unrelated surrounding material, under each additional section that needs it. Keep section-specific explanation beside the embed rather than folding it into shared content.
- Avoid cyclic embed relationships. If the source and destination cannot form a coherent acyclic structure, place the canonical content at an appropriate shared ancestor or keep the content separate.

## Structure the content

1. Identify the graph's purpose, audience, and source material. Separate durable subjects, narrative, classifications, and queryable facts.
2. Draft the heading tree before assigning content. Make heading level and parent-child placement agree: H1 starts a top-level section; each lower-level heading belongs beneath the nearest preceding heading that contains it.
3. Assign each block to the narrowest section it supports. Content before a nested heading remains with the enclosing section; content after that heading belongs to the nested section until the next peer or ancestor heading.
4. Mark repeated statements and related-but-not-identical statements. Select one canonical location for truly shared information; preserve qualifiers and local context that change meaning.
5. Place category/classification, typed fields, and entity relationships according to their distinct roles. Keep schema definitions consistent and avoid near-duplicate categories.
6. Review the resulting outline for orphaned content, artificial depth, duplicated facts, conflicting definitions, and relationships that should be navigable or queryable.

## Plan multi-entity imports

Build outward from identity and avoid defining the same concept twice:

1. Choose durable pages for subjects that need independent identity.
2. Define shared classifications and fields conceptually before populating entities. A tag/class describes a reusable kind; its properties describe values shared by members of that kind.
3. Establish cross-entity relationships as relationships, not as text that merely resembles a title.
4. Lay out the complete hierarchy with meaningful depth. Each level should express a real containment or conceptual relationship; do not add nesting for visual indentation alone.
5. Attach classifications and values to the entities they describe, keeping schema, instance values, and narrative content distinct.
6. Review sibling order, section ownership, duplicate concepts, and whether each entity has a clear canonical meaning.

## Structural principles

- Preserve a single clear parent for each block in the outline; use links and embeds for cross-cutting relationships rather than forcing a block into multiple branches.
- Prefer meaningful, readable outlines over excessive nesting. Width is usually easier to navigate than deep artificial hierarchies.
- Keep classification, property values, narrative, and cross-entity relationships as distinct concepts.
- Canonicalize only information that is semantically equivalent. Similar wording is not proof that two statements mean the same thing.
- Reorganize existing material conservatively. Retain unique facts, qualifications, provenance, and section-specific context.
