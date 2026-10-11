# ubereats

Claude Code and Codex plugin: a Bun MCP server (`src/`, bundled to `dist/server.js`) that runs Python scripts (`scripts/`, `lib/`) under uv. The scripts call the internal Uber Eats web APIs. Read [README.md](README.md) first.

## Rules

- No tool orders food or pays. Do not add one.
- `ubereats_update_ledger` and `ubereats_dump_cookie` need `confirm: true`. Keep it.
- A ledger update keeps existing rows, paid states, paid dates, notes and name mappings, and never adds a debt twice.
- Cookies are credentials. Never print them, never commit them, and write cookie files with mode 600.
- Keep tool names, parameters and output schemas stable.
- `plugin.json` and `mcp.json` are the manifest sources. Do not hand-edit the generated `.claude-plugin/plugin.json`, `.mcp.json` or `dist/server.js`.
- Repository documents and code comments are English.

## Where to run things

In Loki's environment, run `bun install`, the build and the offline tests on `ssh sandbox` in a login shell (`bash -lc`). Tests against the live account run on the Mac and write only to a temporary directory.

## Verify

```sh
bun install --frozen-lockfile
bun run check
claude plugin validate .
```

Build with the Bun version that CI uses (`bun-version` in `.github/workflows/check.yml`). Another version produces a different `dist/server.js`, and the CI diff step fails.

## Release

1. Bump `version` in `package.json` and `plugin.json`, run `bun run check`, and commit the regenerated files.
2. Merge the PR. Then pin the new commit in [zyx1121/marketplace](https://github.com/zyx1121/marketplace) (see its AGENTS.md).
