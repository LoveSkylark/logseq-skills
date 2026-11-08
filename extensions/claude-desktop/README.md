# Logseq Local MCP for Claude Desktop

## Install

Install [`logseq-native.mcpb`](./logseq-native.mcpb) in Claude Desktop:

1. Open **Settings > Desktop app** and select **Manage** next to
   **Extensions**. In older Settings layouts, open **Settings > Extensions**.
2. Choose **Advanced settings**, then find the **Extension Developer** section.
3. Click **Install Extension...**, select the package, and follow the prompts.
4. Configure the endpoint as `http://127.0.0.1:12315/mcp`.
5. Enter a fresh Logseq API token in the sensitive token field.
6. Keep Logseq open with its HTTP API server and native MCP enabled.

The settings layout can vary by Claude Desktop version. Check
[Anthropic's current installation guide](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
if these menu labels differ. If installation succeeds but tools are missing,
restart Claude Desktop and review the extension configuration and connection
status.

The extension accepts loopback URLs only. It adapts Claude Desktop's local
stdio transport to Logseq's loopback Streamable HTTP endpoint; Logseq remains
responsible for tool handling and graph access.

The same package supports Windows and macOS. It uses a platform-neutral Node.js
bridge and does not include operating-system-specific binaries. Run Claude
Desktop and Logseq on the same machine, with Logseq's native MCP server enabled.

## Build and source

The Claude Desktop extension source is in the `source` subdirectory of this
folder. From this directory, run:

```powershell
.\build.ps1
```

This builds the `.mcpb` package into this directory. The extension source and
its build process are maintained here, separately from the Logseq application
build. Rebuild and reinstall after changing the bridge, then reconnect Claude
Desktop.

## Tool behavior

Tool contracts are implemented by the running Logseq application, not by this
transport extension. See the [native MCP tool map](../../../logseq/docs/mcp-native-tool-map.md)
and [end-to-end checklist](../../../logseq/docs/mcp-native-e2e-test.md).
The checklist is a test specification, not a results log.

The extension does not advertise MCP form elicitation. For `datascriptQuery`,
Logseq displays its Approve once/Cancel dialog, with Cancel as the default.
Every invocation requires approval of its exact query and inputs. There is no
automatic approval or retry.

Run the local bridge tests from this directory:

```powershell
node --test .\source\server\index.test.js
```
