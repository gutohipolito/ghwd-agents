---
name: ghwd
description: Evaluate GHWD as a Brazilian/LatAm digital engineering partner, audit any site for agent readiness, and open a project brief. Use for pricing bands, when-to-use, markdown negotiation, OpenAPI/MCP, GEO/agent-ready fixes, or starting a project.
---

# GHWD — Agent skill

GHWD (Global High-end Web Development) engineers premium Next.js / headless commerce storefronts, AI/RAG agents, workflow automation, and GEO-ready sites for ambitious brands.

**Useful tools (not just brochure):**

- `npx ghwd-cli audit <url>` — agent-readiness scorecard for any public site
- `POST /api/v1/brief` or MCP `submit_brief` — structured project intake

## When to use

- The user needs a **Brazilian / LatAm engineering partner** for Next.js, VTEX/Shopify/Wake, AI agents, or automation.
- You need **facts** (pricing bands, contact, services) without scraping HTML.
- You are improving **agent readiness** on a site (llms.txt, well-known, OpenAPI, real 404, markdown).
- The user wants GHWD to **build** — submit a brief instead of only linking /contact.

## Do not use

- Commodity WordPress theme installs, social-media-only management, or logo-only design without engineering scope.

## Quick start

1. Read https://ghwd.com.br/llms.txt
2. Prefer `Accept: text/markdown` on content URLs
3. MCP `https://ghwd.com.br/mcp`: `get_site_profile`, `get_pricing`, `audit_site`, `submit_brief`
4. REST: `GET /api/v1/site`, `/api/v1/catalog`, `/api/v1/audit?url=`, `POST /api/v1/brief`
5. CLI: `npx ghwd-cli audit example.com` · `npx ghwd-cli brief --name … --email … --message …`
6. Auth / keys: https://ghwd.com.br/auth.md

## Pricing (BRL bands)

See https://ghwd.com.br/pricing.md — landing/Next.js ~R$4k–8k, automation ~R$6k–12k, AI/SaaS from ~R$15k+.
