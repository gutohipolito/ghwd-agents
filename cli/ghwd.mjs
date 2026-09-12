#!/usr/bin/env node
/**
 * GHWD CLI — Agent Discovery probes + agent-readiness audit + brief intake.
 *
 * Usage:
 *   npx ghwd-cli health
 *   npx ghwd-cli audit https://example.com
 *   npx ghwd-cli audit https://example.com --json
 *   npx ghwd-cli brief --name "Ana" --email ana@acme.com --message "Preciso de um site agent-ready"
 */
import { auditSite, formatAuditReport } from "./lib/audit.mjs";

const BASE = process.env.GHWD_BASE || "https://ghwd.com.br";

const GET_COMMANDS = {
  health: "/api/v1/health",
  site: "/api/v1/site",
  catalog: "/api/v1/catalog",
  versioning: "/api/v1/versioning",
  openapi: "/openapi.json",
};

function printHelp() {
  console.log(`ghwd — Agent Discovery CLI

Commands:
  health                 GET /api/v1/health
  site                   GET /api/v1/site
  catalog                GET /api/v1/catalog
  versioning             GET /api/v1/versioning
  openapi                GET /openapi.json
  audit <url> [--json]   Agent-readiness scorecard for any public site
  brief [flags]          Submit a project brief to GHWD

Audit examples:
  npx ghwd-cli audit https://ghwd.com.br
  npx ghwd-cli audit cliente.com.br --json

Brief flags:
  --name <text>          Required
  --email <addr>         Required
  --message <text>       Required
  --company <text>
  --budget <band>        e.g. "4k-8k" | "15k+"
  --stack <text>         e.g. "Next.js + VTEX"
  --site <url>           Site to discuss / already audited
  --audit-score <n>
  --audit-grade <A-F>

Env:
  GHWD_BASE              Override API origin (default ${BASE})
`);
}

/**
 * @param {string[]} argv
 */
function parseFlags(argv) {
  /** @type {Record<string, string | boolean>} */
  const flags = {};
  /** @type {string[]} */
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") {
      flags.json = true;
      continue;
    }
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
      continue;
    }
    positionals.push(a);
  }
  return { flags, positionals };
}

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let body = text;
  try {
    body = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    // keep raw
  }
  console.log(body);
  if (!res.ok) process.exit(1);
}

async function runAudit(url, json) {
  const report = await auditSite({ url });
  console.log(formatAuditReport(report, { json: Boolean(json) }));
  // non-zero if grade F (still useful as CI gate optional)
  if (report.grade === "F") process.exitCode = 2;
}

async function runBrief(flags) {
  const name = String(flags.name || "");
  const email = String(flags.email || "");
  const message = String(flags.message || "");
  if (!name || !email || !message) {
    console.error("brief requires --name, --email, and --message");
    process.exit(1);
  }
  const payload = {
    name,
    email,
    message,
    company: flags.company ? String(flags.company) : undefined,
    budget_band: flags.budget ? String(flags.budget) : undefined,
    stack: flags.stack ? String(flags.stack) : undefined,
    site_url: flags.site ? String(flags.site) : undefined,
    audit_score: flags["audit-score"] != null ? Number(flags["audit-score"]) : undefined,
    audit_grade: flags["audit-grade"] ? String(flags["audit-grade"]) : undefined,
    source: "cli",
  };
  const res = await fetch(`${BASE}/api/v1/brief`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body = text;
  try {
    body = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    // keep
  }
  console.log(body);
  if (!res.ok) process.exit(1);
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0] || "help";
  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    printHelp();
    return;
  }

  const { flags, positionals } = parseFlags(argv.slice(1));

  if (cmd === "audit") {
    const url = positionals[0] || String(flags.url || "");
    if (!url) {
      console.error("Usage: ghwd audit <url> [--json]");
      process.exit(1);
    }
    await runAudit(url, flags.json);
    return;
  }

  if (cmd === "brief") {
    await runBrief(flags);
    return;
  }

  const path = GET_COMMANDS[cmd];
  if (!path) {
    console.error(`Unknown command: ${cmd}\nRun: ghwd --help`);
    process.exit(1);
  }
  await getJson(path);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
