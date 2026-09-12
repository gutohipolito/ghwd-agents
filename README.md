# GHWD Agents

Agent-facing surfaces for [ghwd.com.br](https://ghwd.com.br): skills, MCP references, and the official `ghwd-sdk`.

## Install skill (skills.sh / Agent Skills CLI)

```bash
npx skills add gutohipolito/ghwd-agents -g -y
# or pin the skill name
npx skills add gutohipolito/ghwd-agents --skill ghwd -g -y
```

Skill source: [`skills/ghwd/SKILL.md`](./skills/ghwd/SKILL.md)

## Agent plugins

[`plugin.json`](./plugin.json) — Agent Plugins manifest pointing at MCP + skill.

## npm

```bash
npm i ghwd-sdk
npx ghwd-cli health
```

## Live endpoints

- https://ghwd.com.br/llms.txt
- https://ghwd.com.br/mcp
- https://ghwd.com.br/ask
- https://ghwd.com.br/developers/
