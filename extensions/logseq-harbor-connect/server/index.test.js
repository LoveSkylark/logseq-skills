const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

test("tools from every graph are listed with graph prefixes and calls route to the matching graph", async () => {
  const downstreamHandlers = new Map();
  const calls = [];
  const toolsByUrl = {
    "http://localhost:8080/mcp/personal": [{ name: "search", description: "Search" }],
    "http://localhost:8080/mcp/work-sensa": [{ name: "search", description: "Search" }, { name: "getPage", description: "Get page" }]
  };
  const listedUrls = [];
  const fetchStub = async url => {
    listedUrls.push(String(url));
    return {
      ok: true,
      status: 200,
      json: async () => [
        { graph: "Personal", route: "personal", url: "http://localhost:8080/mcp/personal" },
        { graph: "Work - Sensa", route: "work-sensa", url: "http://localhost:8080/mcp/work-sensa" }
      ]
    };
  };
  class Client {
    constructor() { this.url = null; }
    async connect(transport) { this.url = transport.url; }
    async listTools() { return { tools: toolsByUrl[this.url] }; }
    async callTool(params, options) { calls.push({ url: this.url, params, signal: options.signal }); return { ok: true }; }
    async close() {}
  }
  class StreamableHTTPClientTransport {
    constructor(url) { this.url = url; }
  }
  class Server {
    setRequestHandler(method, handler) { downstreamHandlers.set(method, handler); }
  }
  let ready;
  const started = new Promise(resolve => { ready = resolve; });
  const modules = {
    "@modelcontextprotocol/client": { Client, StreamableHTTPClientTransport },
    "@modelcontextprotocol/server": { Server },
    "@modelcontextprotocol/server/stdio": {
      serveStdio(factory) { factory(); ready(); return { async close() {} }; }
    },
    "./graphs": require("./graphs")
  };
  vm.runInNewContext(readFileSync(`${__dirname}/index.js`, "utf8"), {
    require: name => modules[name], URL, AbortSignal, fetch: fetchStub,
    process: {
      env: {
        LOGSEQ_MCP_PROXY_URL: "http://127.0.0.1:8080",
        LOGSEQ_MCP_TOKEN: "test-only"
      },
      stderr: { write() {} }, stdin: { once() {} }, once() {},
      exit() { throw new Error("Unexpected exit"); }
    },
    setTimeout, clearTimeout
  });
  await started;
  assert.deepEqual(listedUrls, ["http://127.0.0.1:8080/mcp"]);

  const listed = await downstreamHandlers.get("tools/list")({ params: {} }, {});
  // Arrays created inside the vm context fail strict deep-equality, so compare strings.
  assert.equal(listed.tools.map(tool => tool.name).join(","),
    "Personal__search,Work-Sensa__search,Work-Sensa__getPage");
  assert.equal(listed.tools[1].description, "[Graph: Work - Sensa] Search");

  const signal = new AbortController().signal;
  await downstreamHandlers.get("tools/call")(
    { params: { name: "Work-Sensa__getPage", arguments: { title: "x" } } },
    { signal }
  );
  assert.equal(calls[0].url.href, "http://localhost:8080/mcp/work-sensa");
  assert.equal(calls[0].params.name, "getPage");
  assert.equal(calls[0].params.arguments.title, "x");
  assert.equal(calls[0].signal, signal);

  await assert.rejects(
    downstreamHandlers.get("tools/call")({ params: { name: "search" } }, { signal }),
    /Unknown tool/
  );
});
