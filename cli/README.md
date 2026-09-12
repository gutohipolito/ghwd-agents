# `ghwd` CLI (`ghwd-cli`)

CLI for the [GHWD Agent Discovery API](https://ghwd.com.br/openapi.json) — discovery probes, **agent-readiness audit**, and **project brief** intake.

## Install

```bash
npx ghwd-cli audit https://example.com
npm i -g ghwd-cli && ghwd audit example.com

# from this repo
node cli/ghwd.mjs audit https://ghwd.com.br
```

Package: https://www.npmjs.com/package/ghwd-cli

## Commands

| Command | What it does |
|---|---|
| `ghwd health` | `GET /api/v1/health` |
| `ghwd site` | `GET /api/v1/site` |
| `ghwd catalog` | `GET /api/v1/catalog` |
| `ghwd versioning` | `GET /api/v1/versioning` |
| `ghwd openapi` | `GET /openapi.json` |
| `ghwd audit <url> [--json]` | Scorecard for any public site |
| `ghwd brief --name … --email … --message …` | Submit a project brief |

```bash
npx ghwd-cli audit cliente.com.br --json
npx ghwd-cli brief \
  --name "Ana" \
  --email ana@acme.com \
  --message "Preciso de Next.js + GEO" \
  --site https://cliente.com.br \
  --budget "15k+"
```

Env: `GHWD_BASE` overrides API origin (default `https://ghwd.com.br`).
