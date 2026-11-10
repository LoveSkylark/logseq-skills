# Logseq Local MCP for Claude Desktop

## Install

The `.mcpb` is a Claude Desktop extension, not a Logseq skill ZIP. The ready-to-install package in this repository is
[`logseq-native.mcpb`](./logseq-native.mcpb). Use this package on the same
Windows or macOS computer that runs Logseq Desktop and Claude Desktop.

### Prepare Logseq

1. Open Logseq Desktop and the DB graph you want Claude to access.
2. Open Logseq's API server controls. Keep the host bound to loopback
   (`127.0.0.1`) and use port `12315`, unless you have deliberately configured
   a different local port.
3. Configure an access token, save its **token value** securely, and start the
   API server. Enable the native MCP endpoint as well.
4. Keep Logseq running. The extension connects to the currently served graph;
   it does not select or switch graphs.

Do not share or commit the token. It is a local Desktop API token, not a
Logseq cloud token. The extension only accepts loopback `/mcp` URLs.

### Install in Claude Desktop

1. In Claude Desktop, open **Settings > Desktop app** and select **Manage**
   next to
   **Extensions**. In older Settings layouts, open **Settings > Extensions**.
2. Choose **Advanced settings**, then find the **Extension Developer** section.
3. Click **Install Extension...**, select
   [`logseq-native.mcpb`](./logseq-native.mcpb), and follow the prompts.
4. Set the MCP URL to `http://127.0.0.1:12315/mcp` (or use your configured
   loopback port) and enter the token value in the sensitive API-token field.
5. Connect to the extension in a Claude conversation. If its tools do not
   appear, restart Claude Desktop and check the extension's configuration and
   connection status.

The settings layout can vary by Claude Desktop version. Check
[Anthropic's current installation guide](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
if these menu labels differ. Organization-managed Claude accounts may restrict
installation of custom extensions; contact the administrator if the install
option is unavailable.

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

This builds the `.mcpb` package into this directory. Building from source
requires Node.js/npm and an internet connection to install dependencies. The
extension source and its build process are maintained here, separately from
the Logseq application build. Rebuild and reinstall after changing the bridge,
then reconnect Claude Desktop.

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
