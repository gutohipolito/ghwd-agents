/**
 * Remote agent-readiness audit for an arbitrary origin.
 * Used by ghwd-sdk and ghwd-cli (no GHWD-specific secrets).
 */

const DEFAULT_TIMEOUT_MS = 10000;
const SOFT404_PATH = `/__ghwd-audit-missing-${Date.now().toString(36)}__`;

/** @typedef {"pass"|"fail"|"warn"|"na"} CheckStatus */
/** @typedef {"required"|"recommended"|"emerging"} CheckTier */

/**
 * @typedef {object} AuditCheck
 * @property {string} id
 * @property {string} name
 * @property {CheckTier} tier
 * @property {CheckStatus} status
 * @property {number} score
 * @property {number} maxScore
 * @property {string} details
 * @property {string} [fix]
 */

/**
 * @typedef {object} AuditReport
 * @property {string} url
 * @property {string} origin
 * @property {string} scannedAt
 * @property {number} score
 * @property {string} grade
 * @property {number} maxScore
 * @property {AuditCheck[]} checks
 * @property {string[]} nextSteps
 * @property {{ brief: string, contact: string, docs: string }} cta
 */

/**
 * @param {string} input
 * @returns {URL}
 */
export function normalizeTargetUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("URL is required");
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProto);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }
  url.hash = "";
  url.search = "";
  if (url.pathname === "") url.pathname = "/";
  return url;
}

/**
 * @param {number} score
 * @param {number} maxScore
 */
export function gradeFromScore(score, maxScore) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 90) return "A";
  if (pct >= 75) return "B";
  if (pct >= 60) return "C";
  if (pct >= 40) return "D";
  return "F";
}

/**
 * @param {string} origin
 * @param {string} path
 */
function joinUrl(origin, path) {
  return new URL(path, origin.endsWith("/") ? origin : `${origin}/`).toString();
}

/**
 * @param {typeof fetch} fetchImpl
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number }} [init]
 */
async function fetchSafe(fetchImpl, url, init = {}) {
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { timeoutMs: _t, ...rest } = init;
    const res = await fetchImpl(url, { ...rest, redirect: "follow", signal: controller.signal });
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      text,
      finalUrl: res.url || url,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      headers: new Headers(),
      text: "",
      finalUrl: url,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {Headers} headers
 * @param {string} name
 */
function headerGet(headers, name) {
  try {
    return headers.get(name) || "";
  } catch {
    return "";
  }
}

/**
 * @param {object} opts
 * @param {string} opts.url
 * @param {typeof fetch} [opts.fetch]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<AuditReport>}
 */
export async function auditSite(opts) {
  const target = normalizeTargetUrl(opts.url);
  const origin = target.origin;
  const fetchImpl = opts.fetch || globalThis.fetch.bind(globalThis);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  /** @type {AuditCheck[]} */
  const checks = [];

  /**
   * @param {Omit<AuditCheck, "score"> & { score?: number }} partial
   */
  function add(partial) {
    const maxScore = partial.maxScore;
    let score = partial.score ?? 0;
    if (partial.status === "pass") score = maxScore;
    else if (partial.status === "warn") score = Math.max(0, Math.floor(maxScore / 2));
    else if (partial.status === "fail" || partial.status === "na") score = 0;
    checks.push({ ...partial, score, maxScore });
  }

  const get = (path, init = {}) =>
    fetchSafe(fetchImpl, joinUrl(origin, path), { ...init, timeoutMs });

  // --- probes (limited concurrency via sequential batches) ---
  const home = await get("/");
  const llms = await get("/llms.txt");
  const robots = await get("/robots.txt");
  const ard = await get("/.well-known/ard.json");
  const aiCatalog = await get("/.well-known/ai-catalog.json");
  const agentCard = await get("/.well-known/agent-card.json");
  const mcpCard = await get("/.well-known/mcp/server-card.json");
  const openapi = await get("/openapi.json");
  const sitemap = await get("/sitemap.xml");
  const soft404 = await get(SOFT404_PATH);
  const mdHome = await get("/", {
    headers: { Accept: "text/markdown, text/plain;q=0.9, */*;q=0.1" },
  });
  const ask = await get("/ask?query=health");
  const pricing = await get("/pricing.md");

  // 1. Homepage reachable
  add({
    id: "homepage",
    name: "Homepage reachable",
    tier: "required",
    maxScore: 2,
    status: home.ok ? "pass" : "fail",
    details: home.ok
      ? `HTTP ${home.status}`
      : `Unreachable (${home.status || home.error || "error"})`,
    fix: "Ensure https://your-domain/ returns 200.",
  });

  // 2. llms.txt
  {
    const body = llms.text || "";
    const hasWhen = /when[\s-]?to[\s-]?use/i.test(body);
    let status /** @type {CheckStatus} */ = "fail";
    let details = `HTTP ${llms.status}`;
    if (llms.ok && body.trim().length > 40 && hasWhen) {
      status = "pass";
      details = `Found llms.txt (${body.length} bytes) with when-to-use guidance`;
    } else if (llms.ok && body.trim().length > 40) {
      status = "warn";
      details = "llms.txt present but missing a clear when-to-use section";
    }
    add({
      id: "llms-txt",
      name: "llms.txt",
      tier: "required",
      maxScore: 3,
      status,
      details,
      fix: "Publish /llms.txt with when-to-use, canonical URLs, and agent entrypoints.",
    });
  }

  // 3. robots.txt
  {
    const body = robots.text || "";
    const hasSitemap = /sitemap:/i.test(body);
    let status /** @type {CheckStatus} */ = "fail";
    let details = `HTTP ${robots.status}`;
    if (robots.ok && body.trim()) {
      status = hasSitemap ? "pass" : "warn";
      details = hasSitemap
        ? "robots.txt present with Sitemap directive"
        : "robots.txt present but no Sitemap directive";
    }
    add({
      id: "robots-txt",
      name: "robots.txt",
      tier: "required",
      maxScore: 2,
      status,
      details,
      fix: "Publish /robots.txt and include a Sitemap: line.",
    });
  }

  // 4. ARD / AI catalog
  {
    const ardOk = ard.ok && looksLikeJsonObject(ard.text);
    const aiOk = aiCatalog.ok && looksLikeJsonObject(aiCatalog.text);
    let status /** @type {CheckStatus} */ = "fail";
    let details = "No /.well-known/ard.json or ai-catalog.json";
    if (ardOk) {
      status = "pass";
      details = "ARD catalog at /.well-known/ard.json";
    } else if (aiOk) {
      status = "warn";
      details = "Legacy AI catalog found (prefer ard.json)";
    }
    add({
      id: "ard-catalog",
      name: "Agent discovery catalog",
      tier: "recommended",
      maxScore: 2,
      status,
      details,
      fix: "Publish /.well-known/ard.json listing MCP, APIs, and skills.",
    });
  }

  // 5. Agent card
  add({
    id: "agent-card",
    name: "Agent card",
    tier: "recommended",
    maxScore: 1,
    status: agentCard.ok && looksLikeJsonObject(agentCard.text) ? "pass" : "fail",
    details: agentCard.ok
      ? "Found /.well-known/agent-card.json"
      : `Missing agent-card (HTTP ${agentCard.status})`,
    fix: "Publish /.well-known/agent-card.json (A2A-style).",
  });

  // 6. MCP discovery
  {
    const cardOk = mcpCard.ok && looksLikeJsonObject(mcpCard.text);
    add({
      id: "mcp-card",
      name: "MCP server card",
      tier: "recommended",
      maxScore: 2,
      status: cardOk ? "pass" : "fail",
      details: cardOk
        ? "Found /.well-known/mcp/server-card.json"
        : `Missing MCP server-card (HTTP ${mcpCard.status})`,
      fix: "Publish /.well-known/mcp/server-card.json and a Streamable HTTP /mcp endpoint.",
    });
  }

  // 7. OpenAPI
  {
    let status /** @type {CheckStatus} */ = "fail";
    let details = `HTTP ${openapi.status}`;
    if (openapi.ok && looksLikeJsonObject(openapi.text)) {
      try {
        const doc = JSON.parse(openapi.text);
        if (doc.openapi || doc.swagger) {
          status = "pass";
          details = `OpenAPI ${doc.openapi || doc.swagger} at /openapi.json`;
        } else {
          status = "warn";
          details = "JSON at /openapi.json but missing openapi field";
        }
      } catch {
        status = "fail";
        details = "Invalid JSON at /openapi.json";
      }
    }
    add({
      id: "openapi",
      name: "OpenAPI document",
      tier: "recommended",
      maxScore: 2,
      status,
      details,
      fix: "Publish /openapi.json describing public agent APIs.",
    });
  }

  // 8. Sitemap
  add({
    id: "sitemap",
    name: "XML sitemap",
    tier: "recommended",
    maxScore: 1,
    status: sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.text) ? "pass" : "fail",
    details: sitemap.ok ? "sitemap.xml present" : `Missing sitemap (HTTP ${sitemap.status})`,
    fix: "Publish /sitemap.xml covering HTML and agent-facing pages.",
  });

  // 9. Real 404 (not soft-404)
  {
    let status /** @type {CheckStatus} */ = "fail";
    let details = `Probe returned HTTP ${soft404.status}`;
    if (soft404.status === 404 || soft404.status === 410) {
      status = "pass";
      details = `Missing path correctly returns ${soft404.status}`;
    } else if (soft404.status === 200) {
      status = "fail";
      details = "Soft-404: missing path returned 200 (agents treat this as real content)";
    } else if (soft404.status === 0) {
      status = "warn";
      details = `Could not probe 404 behavior (${soft404.error || "network error"})`;
    } else {
      status = "warn";
      details = `Unexpected status ${soft404.status} for missing path (prefer 404)`;
    }
    add({
      id: "real-404",
      name: "Real HTTP 404",
      tier: "required",
      maxScore: 3,
      status,
      details,
      fix: "Return real 404 for unknown paths — do not rewrite missing URLs to 404.html with 200.",
    });
  }

  // 10. Markdown negotiation / twin
  {
    const ct = headerGet(mdHome.headers, "content-type").toLowerCase();
    const body = mdHome.text || "";
    const looksMd =
      ct.includes("text/markdown") ||
      ct.includes("text/plain") ||
      /^---\s*\n/.test(body) ||
      /^#\s+\S/m.test(body.slice(0, 400));
    let status /** @type {CheckStatus} */ = "fail";
    let details = "No markdown response for Accept: text/markdown";
    if (mdHome.ok && looksMd && !ct.includes("text/html")) {
      status = "pass";
      details = `Markdown-friendly response (${ct || "no content-type"})`;
    } else if (mdHome.ok && looksMd) {
      status = "warn";
      details = "Body looks like markdown but Content-Type is HTML";
    }
    add({
      id: "markdown-negotiation",
      name: "Markdown for agents",
      tier: "recommended",
      maxScore: 2,
      status,
      details,
      fix: "Serve text/markdown via Accept negotiation or publish /index.md twins.",
    });
  }

  // 11. JSON-LD on homepage
  {
    const hasLd =
      /application\/ld\+json/i.test(home.text || "") ||
      /"@type"\s*:\s*"(Organization|WebSite|SoftwareApplication)"/i.test(home.text || "");
    add({
      id: "json-ld",
      name: "JSON-LD on homepage",
      tier: "recommended",
      maxScore: 2,
      status: home.ok && hasLd ? "pass" : "fail",
      details: home.ok && hasLd ? "Structured data script detected" : "No Organization/WebSite JSON-LD detected",
      fix: "Embed JSON-LD (Organization + WebSite) on the homepage.",
    });
  }

  // 12. Pricing / commercial clarity (emerging)
  add({
    id: "pricing-md",
    name: "Pricing markdown",
    tier: "emerging",
    maxScore: 1,
    status: pricing.ok && pricing.text.trim().length > 40 ? "pass" : "na",
    details: pricing.ok
      ? "pricing.md available"
      : "Optional: publish /pricing.md for agent commercial clarity",
    fix: "Publish /pricing.md with clear bands or packaging.",
  });

  // 13. NLWeb /ask (emerging)
  {
    let status /** @type {CheckStatus} */ = "na";
    let details = "Optional NLWeb /ask not detected";
    if (ask.status && ask.status !== 404 && ask.status !== 0) {
      if (ask.ok && looksLikeJsonObject(ask.text) && /"results"|query_id/i.test(ask.text)) {
        status = "pass";
        details = "NLWeb-style /ask returned JSON results";
      } else {
        status = "warn";
        details = `/ask responded HTTP ${ask.status} but payload is not NLWeb-like`;
      }
    }
    add({
      id: "nlweb-ask",
      name: "NLWeb /ask",
      tier: "emerging",
      maxScore: 1,
      status,
      details,
      fix: "Implement GET/POST /ask returning { query_id, results } (NLWeb).",
    });
  }

  const scored = checks.filter((c) => c.status !== "na");
  const maxScore = scored.reduce((sum, c) => sum + c.maxScore, 0);
  const score = scored.reduce((sum, c) => sum + c.score, 0);
  const grade = gradeFromScore(score, maxScore);

  const nextSteps = checks
    .filter((c) => c.status === "fail" || c.status === "warn")
    .sort((a, b) => {
      const tierRank = { required: 0, recommended: 1, emerging: 2 };
      return (tierRank[a.tier] ?? 9) - (tierRank[b.tier] ?? 9) || b.maxScore - a.maxScore;
    })
    .slice(0, 6)
    .map((c) => `${c.name}: ${c.fix || c.details}`);

  return {
    url: target.toString(),
    origin,
    scannedAt: new Date().toISOString(),
    score,
    maxScore,
    grade,
    percent: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    checks,
    nextSteps,
    cta: {
      brief: "https://ghwd.com.br/api/v1/brief",
      contact: "https://ghwd.com.br/contact/",
      docs: "https://ghwd.com.br/developers/",
    },
  };
}

/**
 * @param {string} text
 */
function looksLikeJsonObject(text) {
  const t = (text || "").trim();
  return t.startsWith("{") || t.startsWith("[");
}

/**
 * Human-readable report for CLI stdout.
 * @param {AuditReport & { percent?: number }} report
 * @param {{ json?: boolean }} [opts]
 */
export function formatAuditReport(report, opts = {}) {
  if (opts.json) return JSON.stringify(report, null, 2);

  const lines = [];
  const pct = report.percent ?? (report.maxScore ? Math.round((report.score / report.maxScore) * 100) : 0);
  lines.push(`GHWD agent-readiness audit`);
  lines.push(`Target:  ${report.url}`);
  lines.push(`Score:   ${report.score}/${report.maxScore} (${pct}%)  grade ${report.grade}`);
  lines.push(`Scanned: ${report.scannedAt}`);
  lines.push("");

  const icon = { pass: "✓", fail: "✗", warn: "!", na: "·" };
  for (const c of report.checks) {
    const mark = icon[c.status] || "?";
    lines.push(
      `${mark} [${c.tier}] ${c.name.padEnd(28)} ${String(c.score).padStart(1)}/${c.maxScore}  ${c.details}`
    );
  }

  if (report.nextSteps?.length) {
    lines.push("");
    lines.push("Next steps:");
    for (const step of report.nextSteps) lines.push(`  - ${step}`);
  }

  lines.push("");
  lines.push(`Submit a project brief: POST ${report.cta.brief}`);
  lines.push(`Talk to GHWD:           ${report.cta.contact}`);
  return lines.join("\n");
}

export default auditSite;
