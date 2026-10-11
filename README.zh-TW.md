<!-- 翻譯自 README.md @ docs/readme-template-v2。只翻 "For AI agents" 以上的章節，英文版更新時一起改。 -->

<div align="center">

<h1>Uber Eats</h1>

<p><strong>把 Uber Eats 訂單紀錄、收據和團購帳本變成 MCP 工具。</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx1121/ubereats/check.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx1121/ubereats/actions)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-D97757?style=flat-square)](https://github.com/zyx1121/marketplace)
[![License](https://img.shields.io/github/license/zyx1121/ubereats?style=flat-square)](LICENSE)

[English](README.md) | **繁體中文** | [简体中文](README.zh-CN.md)

</div>

團購之後，總有一堆收據要看，還有朋友欠你錢。這個 plugin 給 Codex 和 Claude Code 4 個工具：列出訂單、存下逐項收據，並更新欠款帳本。它不能訂餐，也不能付款。

## 功能

- **列出訂單**：讀取 Uber Eats 帳號的訂單資料，存成 `index.json`。
- **存下收據**：逐項收據存成 JSON，附索引和摘要。
- **維護團購帳本**：把新的欠款加進 `debts.csv`，保留已付狀態、付款日期、備註和真實姓名。
- **匯出 Safari 登入狀態**：把目前的 cookie 寫成權限 600 的檔案(僅 macOS)。

## 快速開始

```sh
claude plugin marketplace add zyx1121/marketplace
claude plugin install ubereats@zyx1121
```

Codex：先 `codex plugin marketplace add zyx1121/marketplace`，再 `codex plugin add ubereats@zyx1121`。在 Safari 登入 Uber Eats，開新的對話，請它「列出我這個月的 Uber Eats 訂單」。

需要 Bun 和 uv 在主機的 `PATH` 上。MCP server 已經打包好。

## 使用方式

| 工具 | 結果 | 寫入 |
|------|------|------|
| `ubereats_list_orders` | 訂單資料 | `out` 裡的 `index.json` |
| `ubereats_fetch_receipts` | 選定訂單的收據 | `out` 裡的收據 JSON、索引和摘要 |
| `ubereats_update_ledger` | 新的團購欠款 | `debts.csv` 和 `names.csv`，需要 `confirm: true` |
| `ubereats_dump_cookie` | 目前的 Safari 登入狀態 | 權限 600 的 cookie 檔，需要 `confirm: true`，僅 macOS |

- 先用 `ubereats_list_orders`，再抓你要的收據。
- 帳本只算你自己開的、沒取消的團購，並扣掉你自己的份。重跑不會重複加欠款。
- 金額是餐點小計，不會分攤外送費或折扣。
- `out` 和 `csv_dir` 請用絕對路徑。預設值(`./ue_receipts_out`、`./ue_ledger`)是相對於 MCP server 的工作目錄。

## 設定

工具依序尋找登入狀態：`cookie_file` 參數、Safari 的 cookie，然後是 `~/.config/ubereats/cookie.txt`。在 Linux 上，把原始的 `Cookie` 標頭放進那個檔案。

| 變數 | 作用 | 預設 |
|------|------|------|
| `UBEREATS_MCP_MAX_STRING_CHARS` | 結果中單一字串的長度上限 | `20000` |
| `UBEREATS_MCP_MAX_TOTAL_CHARS` | 結果的總長度上限 | `120000` |
| `UBEREATS_FORCE_PLATFORM` | 僅供註冊測試的平台覆寫 | 實際平台 |

如果 macOS 擋住 Safari 的 cookie，給 MCP 主機「完整磁碟取用權限」，或直接傳 `cookie_file`。cookie 就是憑證，不要放進任何 repo。

## 運作方式

Bun 的 MCP server 只註冊主機能執行的工具，其他的會隱藏，原因寫在 stderr。每次呼叫都用 uv 執行一支 Python 腳本，腳本用你的瀏覽器登入狀態呼叫 Uber Eats 的內部網頁 API。

## 限制

- 內部 API 隨時可能改變。
- 登入過期時可能回傳空列表，而不是 HTTP 401。看到空結果前，先重新登入。
- 匯出 cookie 需要 macOS，其他 3 個工具在 Linux 也能用。

## 其他

給 AI agent 的結構化資訊與開發說明在[英文版](README.md#for-ai-agents)。

## 授權

[MIT](LICENSE)
