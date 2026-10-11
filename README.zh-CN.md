<!-- 翻译自 README.md @ docs/readme-template-v2。只翻译 "For AI agents" 之前的章节，英文版更新时一起改。 -->

<div align="center">

<h1>Uber Eats</h1>

<p><strong>把 Uber Eats 订单记录、收据和拼单账本变成 MCP 工具。</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx1121/ubereats/check.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx1121/ubereats/actions)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-D97757?style=flat-square)](https://github.com/zyx1121/marketplace)
[![License](https://img.shields.io/github/license/zyx1121/ubereats?style=flat-square)](LICENSE)

[English](README.md) | [繁體中文](README.zh-TW.md) | **简体中文**

</div>

拼单之后，总有一堆收据要看，还有朋友欠你钱。这个插件给 Codex 和 Claude Code 4 个工具：列出订单、保存逐项收据，并更新欠款账本。它不能点餐，也不能付款。

## 功能

- **列出订单**：读取 Uber Eats 账号的订单数据，保存为 `index.json`。
- **保存收据**：逐项收据保存为 JSON，附索引和摘要。
- **维护拼单账本**：把新的欠款加进 `debts.csv`，保留已付状态、付款日期、备注和真实姓名。
- **导出 Safari 登录状态**：把当前的 cookie 写成权限 600 的文件(仅 macOS)。

## 快速开始

```sh
claude plugin marketplace add zyx1121/marketplace
claude plugin install ubereats@zyx1121
```

Codex：先 `codex plugin marketplace add zyx1121/marketplace`，再 `codex plugin add ubereats@zyx1121`。在 Safari 登录 Uber Eats，开新的对话，请它“列出我这个月的 Uber Eats 订单”。

需要 Bun 和 uv 在主机的 `PATH` 上。MCP server 已经打包好。

## 使用方法

| 工具 | 结果 | 写入 |
|------|------|------|
| `ubereats_list_orders` | 订单数据 | `out` 里的 `index.json` |
| `ubereats_fetch_receipts` | 选定订单的收据 | `out` 里的收据 JSON、索引和摘要 |
| `ubereats_update_ledger` | 新的拼单欠款 | `debts.csv` 和 `names.csv`，需要 `confirm: true` |
| `ubereats_dump_cookie` | 当前的 Safari 登录状态 | 权限 600 的 cookie 文件，需要 `confirm: true`，仅 macOS |

- 先用 `ubereats_list_orders`，再抓取你要的收据。
- 账本只计算你自己发起的、没取消的拼单，并扣掉你自己的份额。重新运行不会重复加欠款。
- 金额是餐品小计，不会分摊配送费或折扣。
- `out` 和 `csv_dir` 请用绝对路径。默认值(`./ue_receipts_out`、`./ue_ledger`)是相对于 MCP server 的工作目录。

## 配置

工具依次查找登录状态：`cookie_file` 参数、Safari 的 cookie，然后是 `~/.config/ubereats/cookie.txt`。在 Linux 上，把原始的 `Cookie` 请求头放进那个文件。

| 变量 | 作用 | 默认值 |
|------|------|--------|
| `UBEREATS_MCP_MAX_STRING_CHARS` | 结果中单个字符串的长度上限 | `20000` |
| `UBEREATS_MCP_MAX_TOTAL_CHARS` | 结果的总长度上限 | `120000` |
| `UBEREATS_FORCE_PLATFORM` | 仅供注册测试的平台覆盖 | 实际平台 |

如果 macOS 拦截 Safari 的 cookie，给 MCP 主机“完全磁盘访问权限”，或直接传入 `cookie_file`。cookie 就是凭证，不要放进任何 repo。

## 工作原理

Bun 的 MCP server 只注册主机能运行的工具，其他的会隐藏，原因写在 stderr。每次调用都用 uv 运行一个 Python 脚本，脚本用你的浏览器登录状态调用 Uber Eats 的内部网页 API。

## 限制

- 内部 API 随时可能改变。
- 登录过期时可能返回空列表，而不是 HTTP 401。看到空结果前，先重新登录。
- 导出 cookie 需要 macOS，其他 3 个工具在 Linux 也能用。

## 其他

给 AI agent 的结构化信息与开发说明见[英文版](README.md#for-ai-agents)。

## 许可证

[MIT](LICENSE)
