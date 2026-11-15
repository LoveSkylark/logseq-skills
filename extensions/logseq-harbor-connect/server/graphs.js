const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);

// Tool names are prefixed with this slug, so the slug must stay within Claude's
// tool-name character set (letters, digits, hyphens) and must not contain "__".
function slugify(name) {
  return name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// The proxy root, e.g. http://127.0.0.1:8080. Graph routes are discovered from /mcp.
function parseProxyUrl(text) {
  let url;
  try {
    url = new URL(String(text).trim());
  } catch {
    throw new Error("The Logseq proxy URL is not a valid URL.");
  }
  if (!loopbackHosts.has(url.hostname)) {
    throw new Error("The Logseq proxy URL must point to a loopback address.");
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("The Logseq proxy URL should be the root address, such as http://127.0.0.1:8080.");
  }
  return url;
}

// Entries come from the proxy's /mcp JSON list: [{ graph, route, url }].
function parseGraphList(value) {
  if (!Array.isArray(value)) {
    throw new Error("The Logseq proxy /mcp endpoint did not return a graph list.");
  }
  const graphs = [];
  const slugs = new Set();
  for (const entry of value) {
    const name = typeof entry?.graph === "string" ? entry.graph.trim() : "";
    if (!name) throw new Error("A graph in the proxy list has no name.");

    let url;
    try {
      url = new URL(entry.url);
    } catch {
      throw new Error(`Graph "${name}" has an invalid MCP URL.`);
    }
    if (!loopbackHosts.has(url.hostname) || !/^\/mcp\/[^/]+$/.test(url.pathname)) {
      throw new Error(`Graph "${name}" must use a loopback /mcp/<graph> URL.`);
    }

    const slug = slugify(name);
    if (!slug) throw new Error(`Graph "${name}" needs letters or digits in its name.`);
    if (slugs.has(slug)) throw new Error(`Two graphs map to the same tool prefix "${slug}".`);
    slugs.add(slug);

    graphs.push({ name, slug, url });
  }
  return graphs;
}

module.exports = { parseProxyUrl, parseGraphList, slugify };
