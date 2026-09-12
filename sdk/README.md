# ghwd-sdk

Official JavaScript SDK for the [GHWD Agent Discovery API](https://ghwd.com.br/openapi.json) — plus a remote **agent-readiness auditor**.

Homepage: https://ghwd.com.br/developers/

## Install

```bash
npm i ghwd-sdk
```

## Usage

```js
import { GhwdClient, auditSite, formatAuditReport } from "ghwd-sdk";

const ghwd = new GhwdClient();
console.log(await ghwd.health());
console.log(await ghwd.site());

// Audit any public site
const report = await auditSite({ url: "https://example.com" });
console.log(formatAuditReport(report));

// Or via client
console.log(await ghwd.audit("https://example.com"));

// Open a project brief
await ghwd.submitBrief({
  name: "Ana",
  email: "ana@acme.com",
  message: "Quero tornar meu e-commerce agent-ready",
  site_url: "https://example.com",
  audit_grade: report.grade,
  audit_score: report.percent,
});
```

## CLI

```bash
npx ghwd-cli audit https://example.com
npx ghwd-cli brief --name Ana --email ana@acme.com --message "…"
```

## Related

- CLI: [`ghwd-cli`](https://www.npmjs.com/package/ghwd-cli)
- OpenAPI: https://ghwd.com.br/openapi.json
- Developers: https://ghwd.com.br/developers/
- MCP: https://ghwd.com.br/mcp
