# Install the Logseq DB Skill

This skill targets the native MCP server built into Logseq Desktop for Logseq
2.x DB graphs. It must not be loaded together with any legacy
`logseq-db-graph` or `logseq-file-graph` skill.

Install this folder using the skill mechanism supported by your agent client.
For Claude Desktop, import the `logseq-db` folder under **Settings >
Customize > Skills**, then enable it in a conversation with the relevant
Logseq DB MCP connector. Other clients may use a different discovery path.

The skill does not contain an API token. Keep credentials in the MCP client's
local server configuration.