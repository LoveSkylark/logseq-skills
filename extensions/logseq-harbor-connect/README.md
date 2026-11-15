# Logseq Harbor Connect for Claude Desktop

One Desktop Extension that connects Claude to several Logseq MCP graphs at once,
for example the per-graph containers started by `logseq-harbor`. Each graph keeps
its own tools. Every tool name is prefixed with the graph's slug, and each tool
description starts with `[Graph: <name>]`.

For a graph named `Work - Sensa`, the slug is `Work-Sensa`, so its `getPage` tool
appears as `Work-Sensa__getPage`. Slugs keep only letters, digits, and hyphens.

## Build

```powershell
.\build.ps1
```

The package is written to `logseq-harbor-connect.mcpb` in this folder. Pass `-OutputPath`
to choose another location.

## Install

In Claude Desktop, open **Settings > Desktop app**, choose **Manage** next to
**Extensions**, then **Advanced settings > Install Extension...** and select the
`.mcpb` file.

Set the two fields:

- **Logseq proxy URL**: the root address of the Harbor reverse proxy, default
  `http://127.0.0.1:8080`. The bridge reads the graph list from its `/mcp`
  endpoint and connects to each graph at `/mcp/<route>`. New graphs appear after
  Harbor regenerates the proxy and the extension restarts.
- **Logseq MCP token**: the `logseq_mcp_token` value from Harbor's `config.yaml`.
  Harbor's MCP containers all share this token.

## Behavior

- The proxy URL must be a loopback address (`127.0.0.1`, `localhost`, or `[::1]`)
  and must be the root address with no path.
- Each graph from `/mcp` must be a loopback `/mcp/<route>` URL.
- The bridge connects to every graph at startup. A graph that can't connect is
  logged and skipped, and the others keep working. If none connect, the bridge exits.
- Tool calls go to the graph named by the prefix. An unknown prefix returns an error.
- Graph names must produce unique slugs, so `Work - Sensa` and `Work-Sensa`
  can't both be configured.

## Tests

```powershell
node --test server/graphs.test.js server/index.test.js
```
