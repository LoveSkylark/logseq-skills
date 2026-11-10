# Logseq Local MCP for Claude Desktop

This Desktop Extension connects Claude to the native MCP server in a running Logseq app. Logseq remains responsible for tool handling and database access; the extension only adapts Claude Desktop's local stdio transport to Logseq's loopback Streamable HTTP endpoint.

## Build

From PowerShell:

```powershell
.\build.ps1
```

By default, the package is written to `logseq-native.mcpb` in the parent
Claude Desktop extension directory. To choose another destination, pass
`-OutputPath`:

```powershell
.\build.ps1 -OutputPath C:\Downloads\logseq-native.mcpb
```

## Install

Before installing, open the target DB graph in Logseq Desktop. In Logseq's API
server controls, keep the host on loopback (`127.0.0.1`), configure an access
token, save its token value securely, start the API server, and enable native
MCP. Keep Logseq running; the extension connects to the graph currently served
by that app and does not switch graphs.

In Claude Desktop, open **Settings > Desktop app** and select **Manage** next
to **Extensions**. In older Settings layouts, open **Settings > Extensions**.
Choose **Advanced settings**, then find the **Extension Developer** section.
Click **Install Extension...**, select the generated `.mcpb` package, and
follow the prompts. Set the URL to `http://127.0.0.1:12315/mcp` (or your
configured loopback port) and enter the token value in the sensitive API-token
field. Connect to the extension in a Claude conversation.

If the extension installs but its tools do not appear, restart Claude Desktop
and check the extension's configuration and connection status.

Claude's settings layout can vary by version. For the latest menu path, see
[Anthropic's installation guide](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop).
Organization-managed Claude accounts may restrict custom extension installs.

To build the distributable package with the repository-level build script,
run `.\build.ps1` from the parent `claude-desktop` directory.

The extension accepts loopback URLs only. It does not expose Logseq or its API
token to the public internet. The token is a local Desktop API token, not a
Logseq cloud token; do not commit or share it.
The same package supports Windows and macOS; the bridge uses Node.js and has
no operating-system-specific binaries.

## Tool contracts

See the [native tool map](../../../../logseq/docs/mcp-native-tool-map.md) for
current behavior and the
[end-to-end test guide](../../../../logseq/docs/mcp-native-e2e-test.md) for
validation.
`findEntities` offers structured read-only page/block searches and exact counts
without raw query text or per-query approval. It retains normal authentication;
its limits bound output, not database execution time. Tool changes live in the
Logseq API/MCP server, not this transport extension.

## Query approval

The extension does not advertise MCP form elicitation. Logseq therefore shows
its Desktop Approve once/Cancel dialog for `datascriptQuery`, with Cancel as the
default. Cancel and X dismissal both refuse without running the query.
Every invocation requires approval of its exact query and inputs, with the
last-resort rationale and expected size. There is no
automatic approval or retry. Query requests and decisions are recorded in
Logseq's Electron log. Output is capped at 1000 rows and 65536 UTF-8 bytes;
the query language is not restricted to any example.

Rebuild and reinstall this extension after changing the bridge,
then reconnect Claude to the rebuilt Logseq server. Local bridge validation:

```powershell
node --test server/index.test.js
```