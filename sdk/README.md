# ghwd-sdk

Official JavaScript SDK for the [GHWD Agent Discovery API](https://ghwd.com.br/openapi.json).

Homepage: https://ghwd.com.br/

## Install

```bash
npm i ghwd-sdk
```

## Usage

```js
import { GhwdClient } from "ghwd-sdk";

const ghwd = new GhwdClient();
const site = await ghwd.site();
const health = await ghwd.health();
const catalog = await ghwd.catalog();
```

```js
const ghwd = new GhwdClient({ baseUrl: "https://ghwd.com.br" });
console.log(await ghwd.pricingMarkdown());
```

## Related

- CLI: [`ghwd-cli`](https://www.npmjs.com/package/ghwd-cli)
- OpenAPI: https://ghwd.com.br/openapi.json
- Developers: https://ghwd.com.br/developers/
- MCP: https://ghwd.com.br/mcp
