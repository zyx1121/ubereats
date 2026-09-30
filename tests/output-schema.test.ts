/**
 * Tier A output schemas parsed against synthetic samples.
 *
 * The samples mirror the key set of real runs captured while writing these
 * schemas, with every value replaced by placeholder data — this repo is public,
 * so no real host, address or calendar name is committed.
 */
import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { mapScriptOutput } from "../src/core/exec.ts";
import { allTools } from "../src/tools/index.ts";

function outputSchemaOf(name: string) {
  const tool = allTools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`unknown tool: ${name}`);
  return z.object(tool.outputSchema);
}

const SAMPLES: Record<string, unknown> = {
  ubereats_list_orders: [
    { uuid: "00000000-0000-0000-0000-000000000001", completedAt: "2026-07-01T12:00:00.000Z", storeUuid: "00000000-0000-0000-0000-0000000000ff", creator: "Example Person", isCreator: true, numItems: 3, isCancelled: false },
    { uuid: "00000000-0000-0000-0000-000000000002", completedAt: null, storeUuid: null, creator: null, isCreator: null, numItems: null, isCancelled: null },
  ],
  ubereats_fetch_receipts: {
    out_dir: "/example/out",
    index_file: "/example/out/index.json",
    summary_file: "/example/out/summary.txt",
    receipts: [{ uuid: "00000000-0000-0000-0000-000000000001", date: "2026-07-01", store: "Example Store", total: 480, people: 3, source: "receipt", file: "/example/out/0000.json" }],
    skipped: ["00000000-0000-0000-0000-000000000003"],
    total: 2,
    with_details: 1,
    from_order_list: 0,
  },
  ubereats_update_ledger: {
    summary: "🧾 新增 1 筆團購欠款:",
    new_debts: [{ order_uuid: "00000000-0000-0000-0000-000000000001", date: "2026-07-01", store: "Example Store", uber_name: "Example Person", items: "1x Example Item", amount: "160", paid: "no", paid_date: "", note: "" }],
    unpaid_by_person: { "Example Person": 160 },
    csv_dir: "/example/ledger",
    debts_csv: "/example/ledger/debts.csv",
    names_csv: "/example/ledger/names.csv",
  },
  ubereats_dump_cookie: { path: "/example/cookie.txt", cookies: 12, mode: 384 },

};

describe("Tier A output schemas", () => {
  for (const [name, data] of Object.entries(SAMPLES)) {
    test(`${name} accepts its real-world shape`, () => {
      const result = outputSchemaOf(name).safeParse({ data, metadata: { count: 1 } });
      expect(result.success ? null : result.error.issues).toBeNull();
    });

    test(`${name} tolerates keys added upstream`, () => {
      const widened = Array.isArray(data) ? [...(data as Record<string, unknown>[]).map((item) => ({ ...item, future_key: "x" }))] : { ...(data as Record<string, unknown>), future_key: "x" };
      const result = outputSchemaOf(name).safeParse({ data: widened, metadata: {} });
      expect(result.success).toBe(true);
    });
  }


});

/**
 * Regression guard for the failure path.
 *
 * The MCP client validates structuredContent against the declared schema even
 * when isError is set, and the generated JSON Schema forbids extra properties.
 * A failure shape that the tool's own schema rejects therefore reaches the
 * caller as a protocol error rather than a readable message. Caught by a live
 * smoke run against safari_get_url with no Safari window open.
 */
describe("failure paths satisfy their own output schema", () => {
  const run = (over: Partial<Parameters<typeof mapScriptOutput>[1]> = {}) => ({
    stdout: "",
    stderr: "",
    exitCode: 1,
    timedOut: false,
    timeoutMs: 1000,
    argv0: "example.py",
    ...over,
  });

  const CASES = {
    "script reported failure": run({ stdout: JSON.stringify({ success: false, error: { message: "boom", why: "because", hint: "do x" } }) }),
    "failure with bare message": run({ stdout: JSON.stringify({ success: false, error: { message: "boom" } }) }),
    "failure with no error detail": run({ stdout: JSON.stringify({ success: false }) }),
    "crash before any output": run({ stderr: "Traceback (most recent call last):", exitCode: 2 }),
    "json that is not an envelope": run({ stdout: JSON.stringify({ whatever: true }) }),
    "timeout": run({ timedOut: true, exitCode: -1 }),
  };

  // Script-backed tools only: utils_capabilities answers from memory and speaks neither shell.
  const scriptTools = allTools.filter((tool) => "data" in tool.outputSchema || "stdout" in tool.outputSchema);

  for (const tool of scriptTools) {
    const isEnvelope = "data" in tool.outputSchema;
    const schema = z.object(tool.outputSchema);

    for (const [label, scriptRun] of Object.entries(CASES)) {
      test(`${tool.name}: ${label}`, () => {
        const result = mapScriptOutput(isEnvelope, scriptRun);
        const parsed = schema.safeParse(result.structuredContent);

        expect(parsed.success ? null : { issues: parsed.error.issues, got: result.structuredContent }).toBeNull();
        expect(result.isError).toBe(true);
      });
    }
  }


});
