const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseProxyUrl, parseGraphList, slugify } = require("./graphs");

test("proxy URL must be a loopback root address", () => {
  assert.equal(parseProxyUrl("http://127.0.0.1:8080").href, "http://127.0.0.1:8080/");
  assert.throws(() => parseProxyUrl("https://example.com"), /loopback/);
  assert.throws(() => parseProxyUrl("http://127.0.0.1:8080/mcp/personal"), /root address/);
  assert.throws(() => parseProxyUrl("not a url"), /valid URL/);
});

test("graph list from /mcp maps each graph to its loopback /mcp/<route> URL", () => {
  const graphs = parseGraphList([
    { graph: "Work - Sensa", route: "work-sensa", url: "http://localhost:8080/mcp/work-sensa" },
    { graph: "Personal", route: "personal", url: "http://127.0.0.1:8080/mcp/personal" }
  ]);
  assert.deepEqual(graphs.map(graph => [graph.name, graph.slug, graph.url.href]), [
    ["Work - Sensa", "Work-Sensa", "http://localhost:8080/mcp/work-sensa"],
    ["Personal", "Personal", "http://127.0.0.1:8080/mcp/personal"]
  ]);
});

test("graph list rejects non-arrays, non-loopback or non-graph URLs, and duplicate prefixes", () => {
  assert.throws(() => parseGraphList({ graph: "Personal" }), /graph list/);
  assert.throws(() => parseGraphList([{ graph: "X", url: "https://example.com/mcp/x" }]), /loopback/);
  assert.throws(() => parseGraphList([{ graph: "X", url: "http://127.0.0.1:8080/sync/x" }]), /loopback/);
  assert.throws(() => parseGraphList([{ url: "http://127.0.0.1:8080/mcp/x" }]), /no name/);
  assert.throws(() => parseGraphList([
    { graph: "Work Sensa", url: "http://127.0.0.1:8080/mcp/a" },
    { graph: "Work-Sensa", url: "http://127.0.0.1:8080/mcp/b" }
  ]), /same tool prefix/);
});

test("slugify keeps tool prefixes to letters, digits, and hyphens", () => {
  assert.equal(slugify("Campaign - 7th Trial"), "Campaign-7th-Trial");
  assert.equal(slugify("  --  "), "");
});
