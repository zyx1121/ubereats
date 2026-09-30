# Uber Eats

Order history, itemized receipts and group-order debt ledgers through 4 native MCP tools.

An independent plugin for Codex and Claude Code. Ask your agent to perform the
task; MCP is the public interface and scripts are the implementation. Extracted
from [zyx1121/plugin](https://github.com/zyx1121/plugin).

## Install

Requires Bun (tested with 1.3.13) and uv on the host PATH.

```sh
# Claude Code
claude plugin marketplace add zyx1121/marketplace
claude plugin install ubereats@zyx1121

# Codex
codex plugin marketplace add zyx1121/marketplace
codex plugin add ubereats@zyx1121
```

Restart the client session after installation. The committed `dist/server.js`
bundle needs no `bun install` in the plugin cache. Both manifests are generated
from `plugin.json` and `mcp.json`; the marketplace pins release commits.

## Use

Ask your agent to list recent orders first, fetch selected receipts, or update
an existing group-order ledger. There is no ordering or payment tool.

| Tool | Result and side effects |
|---|---|
| `ubereats_list_orders` | Lists order metadata and writes `index.json` to `out` |
| `ubereats_fetch_receipts` | Writes receipt JSON, index and summary files to `out` |
| `ubereats_update_ledger` | Rewrites `debts.csv` and `names.csv`; requires `confirm: true` |
| `ubereats_dump_cookie` | Exports a live Safari session to a mode-0600 file; requires `confirm: true` |

The first three tools work on macOS and Linux with uv. Cookie export requires
macOS. Missing dependencies hide the affected tools and are reported on stderr.

Authentication uses, in order: an explicit `cookie_file`, Safari's binarycookies
file if it exists, then `~/.config/ubereats/cookie.txt`. On Linux provide a raw
Cookie header file. If macOS denies access to Safari's cookie jar, grant the host
Full Disk Access or supply `cookie_file` explicitly. Cookies are credentials;
keep them outside this repository. No existing credentials need to move.

These tools use Uber Eats internal web APIs with a browser session. HTTP 401/403
reports rejected credentials; some expired sessions return an empty list instead.
An empty list does not establish that there are no orders. Reauthenticate in the
browser before relying on that result. The API can change independently of this
plugin.

Receipt output defaults to `./ue_receipts_out`; ledger output defaults to
`./ue_ledger`, relative to the MCP server's working directory. Use absolute `out`
and `csv_dir` paths for persistent storage. Existing ledger rows, paid state,
paid dates, notes and real-name mappings are preserved. Only your own uncancelled
group orders contribute new debts, excluding your share. Rerunning does not add
existing debts again. Amounts are item subtotals; order-list fallback values are
estimates and do not allocate delivery fees or discounts.

## Migration

Install `ubereats@zyx1121` before updating zyx to 0.27.0. Short tool names,
parameters, output schemas and confirmation gates are preserved. Claude Code's
provider changes from `plugin_zyx_utils` to `plugin_ubereats_ubereats`. Remove any
manual registration of the same server to avoid duplicates.

## Development

```sh
bun install --frozen-lockfile
bun run check
claude plugin validate .
```

Tests are offline: synthetic results, fake executables, isolated bundled MCP
sessions and ledger/cookie/receipt regressions. They do not modify live apps,
accounts or personal files.

`UBEREATS_MCP_MAX_STRING_CHARS` and `UBEREATS_MCP_MAX_TOTAL_CHARS` control
output truncation (defaults 20000/120000); the corresponding `UTILS_` names remain
fallbacks. `UBEREATS_FORCE_PLATFORM` is a registration-test override and does
not emulate another operating system.

- `src/`: MCP schemas, host checks and subprocess execution
- `scripts/`, `lib/`: domain implementation
- `dist/server.js`: standalone bundled runtime
- `plugin.json`, `mcp.json`: portable manifests
- `.claude-plugin/plugin.json`, `.mcp.json`: generated Claude Code compatibility

## License

[MIT](LICENSE)
