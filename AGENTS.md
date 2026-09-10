# AGENTS.md — GHWD repository

Instructions for AI coding agents working in this repo (https://github.com/gutohipolito/ghwd).

## Product

Marketing / brochure site for **GHWD** (ghwd.com.br): Next.js 16 static export (`output: 'export'`), deployed via GitHub Actions FTP to Apache behind Cloudflare.

## Agent-facing surfaces (do not break)

- `public/.htaccess` — real 404s, markdown negotiation, API rewrites, RateLimit, Link headers
- `public/mcp.php` — Streamable HTTP MCP
- `public/.well-known/*` — ARD, MCP server-card, agent-card, skills, OAuth protected resource
- `public/llms.txt`, `pricing.md`, `auth.md`, `openapi.json`, `api/v1/*.json`
- `scripts/generate-agent-pages.ts` — markdown twins (run on `prebuild`)

## Commands

```bash
npm test
npm run build          # prebuild generates MD; postbuild verifies agent artifacts
npm run generate:agents
node cli/ghwd.mjs health
```

## Constraints

- No Next.js Route Handlers / middleware (static export). Prefer `public/` + Apache/PHP.
- Do not reintroduce soft-404 rewrites to `404.html` with 200.
- Keep visual layout unchanged unless explicitly asked; agent work lives in head links, well-known files, and docs.
- Commit messages in Portuguese style used by the repo (`ajuste:`, `correção:`).
