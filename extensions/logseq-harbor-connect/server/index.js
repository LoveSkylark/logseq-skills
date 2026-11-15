const { Client } = require("@modelcontextprotocol/client");
const { StreamableHTTPClientTransport } = require("@modelcontextprotocol/client");
const { Server } = require("@modelcontextprotocol/server");
const { serveStdio } = require("@modelcontextprotocol/server/stdio");
const { parseProxyUrl, parseGraphList } = require("./graphs");

const SEPARATOR = "__";

function log(message) {
  process.stderr.write(`[logseq-harbor-connect] ${message}\n`);
}

function fail(message) {
  log(message);
  process.exit(1);
}

const token = process.env.LOGSEQ_MCP_TOKEN;
let proxyUrl;
try {
  proxyUrl = parseProxyUrl(process.env.LOGSEQ_MCP_PROXY_URL || "http://127.0.0.1:8080");
} catch (error) {
  fail(error.message);
}
if (!token) {
  fail("Logseq API token is required. Configure this extension in Claude Desktop.");
}

async function discoverGraphs(baseUrl) {
  const listUrl = new URL("/mcp", baseUrl);
  let response;
  try {
    response = await fetch(listUrl, { signal: AbortSignal.timeout(10000) });
  } catch (error) {
    throw new Error(`Could not reach the Logseq proxy at ${listUrl}: ${error.message}`);
  }
  if (!response.ok) {
    throw new Error(`The Logseq proxy at ${listUrl} returned HTTP ${response.status}.`);
  }
  return parseGraphList(await response.json());
}

async function listAllTools(client) {
  const tools = [];
  let cursor;
  do {
    const page = await client.listTools(cursor ? { cursor } : {});
    tools.push(...page.tools);
    cursor = page.nextCursor;
  } while (cursor);
  return tools;
}

async function connectGraph(graph) {
  const client = new Client({
    name: `Logseq Harbor Connect (${graph.name})`,
    version: "0.1.8"
  }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(graph.url, {
    requestInit: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });
  await client.connect(transport);
  return { ...graph, client };
}

async function start() {
  let graphs;
  try {
    graphs = await discoverGraphs(proxyUrl);
  } catch (error) {
    fail(error.message);
  }
  if (graphs.length === 0) {
    fail("The Logseq proxy lists no graphs. Start a graph in harbor and try again.");
  }
  log(`Discovered ${graphs.length} graph(s) from ${new URL("/mcp", proxyUrl).href}.`);

  const settled = await Promise.allSettled(graphs.map(connectGraph));
  const connected = [];
  settled.forEach((result, index) => {
    const graph = graphs[index];
    if (result.status === "fulfilled") {
      connected.push(result.value);
      log(`Connected to graph "${graph.name}".`);
    } else {
      log(`Skipping graph "${graph.name}": ${result.reason?.message || String(result.reason)}`);
    }
  });
  if (connected.length === 0) {
    fail("Could not connect to any configured Logseq graph.");
  }

  const bySlug = new Map(connected.map(graph => [graph.slug, graph]));

  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await Promise.allSettled(connected.map(graph => graph.client.close()));
  };

  serveStdio(() => {
    const server = new Server(
      { name: "Logseq Harbor Connect", version: "0.1.8" },
      { capabilities: { tools: {} } }
    );
    server.setRequestHandler("tools/list", async () => {
      const tools = [];
      for (const graph of connected) {
        try {
          for (const tool of await listAllTools(graph.client)) {
            tools.push({
              ...tool,
              name: `${graph.slug}${SEPARATOR}${tool.name}`,
              description: `[Graph: ${graph.name}] ${tool.description ?? ""}`.trim()
            });
          }
        } catch (error) {
          log(`Could not list tools for "${graph.name}": ${error.message}`);
        }
      }
      return { tools };
    });
    server.setRequestHandler("tools/call", async (request, context) => {
      const { name } = request.params;
      const index = name.indexOf(SEPARATOR);
      const graph = index > 0 ? bySlug.get(name.slice(0, index)) : undefined;
      if (!graph) {
        throw new Error(`Unknown tool "${name}". Tool names are prefixed with a graph name.`);
      }
      return graph.client.callTool(
        { ...request.params, name: name.slice(index + SEPARATOR.length) },
        { signal: context.signal }
      );
    });
    return server;
  }, {
    onerror: error => log(`MCP transport error: ${error.message}`)
  });

  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
  process.stdin.once("end", () => void close());
  log(`Serving ${connected.length} of ${graphs.length} configured graph(s).`);
}

start().catch(error => {
  fail(`Startup failed: ${error.message}`);
});
