<div align="center">

<h1>Uber Eats</h1>

<p><strong>Uber Eats order history, receipts and group-order ledgers as MCP tools.</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx1121/ubereats/check.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx1121/ubereats/actions)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-D97757?style=flat-square)](https://github.com/zyx1121/marketplace)
[![License](https://img.shields.io/github/license/zyx1121/ubereats?style=flat-square)](LICENSE)

**English** | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

</div>

Group orders leave you with receipts to read and friends who owe you money. This plugin gives Codex and Claude Code 4 tools that list your orders, save itemized receipts and keep a debt ledger up to date. It cannot order or pay.

## Features

- **Lists orders**: order metadata from your Uber Eats account, saved as `index.json`.
- **Saves receipts**: itemized receipts as JSON, with an index and a summary.
- **Keeps a group-order ledger**: adds new debts to `debts.csv` and keeps paid states, dates, notes and real names.
- **Exports a Safari session**: writes the live cookie to a mode-600 file, on macOS.

## Quick start

```sh
claude plugin marketplace add zyx1121/marketplace
claude plugin install ubereats@zyx1121
```

Codex: `codex plugin marketplace add zyx1121/marketplace`, then `codex plugin add ubereats@zyx1121`. Log in to Uber Eats in Safari, open a new session and ask "List my Uber Eats orders from this month".

The plugin needs Bun and uv on the host `PATH`. The MCP server ships bundled.

## Usage

| Tool | Result | Writes |
|------|--------|--------|
| `ubereats_list_orders` | order metadata | `index.json` in `out` |
| `ubereats_fetch_receipts` | receipts for the selected orders | receipt JSON, an index and a summary in `out` |
| `ubereats_update_ledger` | new group-order debts | `debts.csv` and `names.csv`. Needs `confirm: true` |
| `ubereats_dump_cookie` | the live Safari session | a mode-600 cookie file. Needs `confirm: true`, macOS only |

- Start with `ubereats_list_orders`, then fetch the receipts that you want.
- The ledger counts only your own group orders that were not canceled, and it leaves out your share. A rerun does not add a debt twice.
- Amounts are item subtotals. They do not split delivery fees or discounts.
- Use absolute `out` and `csv_dir` paths. The defaults (`./ue_receipts_out`, `./ue_ledger`) are relative to the working directory of the MCP server.

## Configuration

The tools look for a session in this order: the `cookie_file` argument, the Safari cookie jar, then `~/.config/ubereats/cookie.txt`. On Linux, put a raw `Cookie` header in that file.

| Variable | Sets | Default |
|----------|------|---------|
| `UBEREATS_MCP_MAX_STRING_CHARS` | longest string in a result | `20000` |
| `UBEREATS_MCP_MAX_TOTAL_CHARS` | largest result | `120000` |
| `UBEREATS_FORCE_PLATFORM` | platform for registration tests only | the real platform |

If macOS blocks the Safari cookie jar, give the MCP host Full Disk Access or pass `cookie_file`. Cookies are credentials, so keep them out of any repository.

## How it works

The Bun MCP server registers the tools that the host can run, and it hides the rest with a reason on stderr. Each call runs a Python script under uv. The scripts call the internal Uber Eats web APIs with your browser session.

## Limits

- The internal APIs can change at any time.
- An expired session can return an empty list instead of HTTP 401. Log in again before you trust an empty result.
- The cookie export needs macOS. The other 3 tools also work on Linux.

## For AI agents

Facts for coding agents and LLM tools. The rules for changing the code are in [AGENTS.md](AGENTS.md).

- **Summary**: Claude Code and Codex plugin with 4 MCP tools for Uber Eats order history, receipts, a group-order debt ledger and Safari cookie export.
- **Type**: plugin
- **Interfaces**: MCP `ubereats` (stdio, `dist/server.js`). Python scripts in `scripts/` run under uv.
- **Install**: `claude plugin install ubereats@zyx1121`, after `claude plugin marketplace add zyx1121/marketplace`
- **Run**: the host starts the MCP server
- **Verify**: call `ubereats_list_orders` with a live session and an absolute `out` path
- **Config**: `UBEREATS_MCP_MAX_STRING_CHARS`, `UBEREATS_MCP_MAX_TOTAL_CHARS`, and a `cookie_file` argument
- **Secrets**: the Uber Eats session cookie, in Safari or in `~/.config/ubereats/cookie.txt`
- **Limits**: no ordering or payment. An empty list can mean an expired session.

## Development

```sh
bun install --frozen-lockfile
bun run check
claude plugin validate .
```

The tests run offline with synthetic results and fake executables. They never touch a real account or personal files.

## License

[MIT](LICENSE)
