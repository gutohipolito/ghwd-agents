# GHWD Agents

Agent-facing surfaces for [ghwd.com.br](https://ghwd.com.br): skills, MCP references, and the official `ghwd-sdk` / `ghwd-cli`.

## Useful tools

```bash
# Score any site for agent readiness
npx ghwd-cli audit https://example.com

# Open a project brief
npx ghwd-cli brief --name "Ana" --email ana@acme.com --message "Preciso de um site agent-ready"
```

## Install skill (skills.sh)

```bash
npx skills add gutohipolito/ghwd-agents -g -y
```

## npm

```bash
npm i ghwd-sdk
npm i -g ghwd-cli
```

## Live endpoints

- https://ghwd.com.br/llms.txt
- https://ghwd.com.br/mcp
- https://ghwd.com.br/api/v1/audit?url=https://example.com
- https://ghwd.com.br/api/v1/brief
- https://ghwd.com.br/developers/
