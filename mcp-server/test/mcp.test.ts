import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  decodeQEvalStringResult,
  GnoRpcClient,
  normalizeRpcUrl,
  quoteGnoExprString,
} from "../src/rpc.js";
import { createHearthMcpServer } from "../src/server.js";
import {
  assertWritableChain,
  computeProofDigest,
  formatUgnotAsGnot,
  HearthConfig,
  HearthToolbox,
} from "../src/tools.js";

const SAMPLE_CONFIG: HearthConfig = {
  rpcUrl: "https://rpc.onyx.testnets.gno.land:443",
  chainId: "onyx-1",
  realmPath: "gno.land/r/hearth/hearthbounty/v0",
  gnowebBaseUrl: "https://onyx.testnets.gno.land",
};

function makeMockFetch(handlers: Record<string, unknown>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    for (const [needle, body] of Object.entries(handlers)) {
      if (url.includes(needle)) {
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }
    return new Response(JSON.stringify({ error: { message: `No mock for ${url}` } }), { status: 404 });
  }) as typeof fetch;
}

function encodeAbciString(s: string): { result: { response: { ResponseBase: { Data: string } } } } {
  return {
    result: {
      response: {
        ResponseBase: {
          Data: Buffer.from(s, "utf8").toString("base64"),
        },
      },
    },
  };
}

function encodeQEvalString(s: string) {
  return encodeAbciString(`(${JSON.stringify(s)} string)`);
}

test("RPC helpers decode vm/qeval string tuples cleanly", () => {
  assert.equal(normalizeRpcUrl("https://rpc.onyx.testnets.gno.land:443///"), "https://rpc.onyx.testnets.gno.land:443");
  assert.equal(quoteGnoExprString(`hello "world"`), `"hello \\"world\\""`);

  const decoded = decodeQEvalStringResult(`("{\\"count\\":3,\\"note\\":\\"ok\\"}" string)`);
  assert.deepEqual(JSON.parse(decoded), { count: 3, note: "ok" });
});

test("Mainnet write safety guard strictly blocks gnoland-1 and allows dev/onyx-1", () => {
  assert.doesNotThrow(() => assertWritableChain("dev"));
  assert.doesNotThrow(() => assertWritableChain("onyx-1"));
  assert.doesNotThrow(() => assertWritableChain("test17"));

  assert.throws(() => assertWritableChain("gnoland-1"), /Safety block/);
  assert.throws(() => assertWritableChain("mainnet"), /Safety block/);
  assert.throws(() => assertWritableChain("custom-prod"), /Safety block/);
});

test("Deterministic SHA-256 proof digest and GNOT formatting", () => {
  // Standard NIST SHA-256 test vector for "abc".
  assert.equal(
    computeProofDigest("abc"),
    "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(formatUgnotAsGnot(1_000_000), "1.00 GNOT");
  assert.equal(formatUgnotAsGnot(2_500_000), "2.50 GNOT");
  assert.equal(formatUgnotAsGnot(123_456), "0.123456 GNOT");
});

test("MCP server registers all 10 tools and executes tool calls over MCP protocol", async () => {
  const server = createHearthMcpServer(SAMPLE_CONFIG);
  const client = new Client({ name: "hearth-test-client", version: "0.1.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const listed = await client.listTools();
  const names = listed.tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "hearth_chain_status",
    "hearth_get_bounty",
    "hearth_get_profile",
    "hearth_leaderboard",
    "hearth_list_bounties",
    "hearth_prepare_claim",
    "hearth_prepare_post_bounty",
    "hearth_prepare_settle",
    "hearth_prepare_submit_proof",
    "hearth_render_page",
  ]);

  const callRes = await client.callTool({
    name: "hearth_prepare_post_bounty",
    arguments: {
      title: "MCP Protocol Test Bounty",
      spec: "Verify that hearthbounty-mcp builds a valid gnokey and gnomcp payload over MCP.",
      category: "agent",
      rewardUgnot: 2_000_000,
    },
  });
  const firstText = (callRes.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
  const parsed = JSON.parse(firstText) as {
    rewardFormatted: string;
    transaction: { func: string; send: string; gnomcpCallArgs: { profile: string } };
  };
  assert.equal(parsed.rewardFormatted, "2.00 GNOT");
  assert.equal(parsed.transaction.func, "PostBounty");
  assert.equal(parsed.transaction.send, "2000000ugnot");
  assert.equal(parsed.transaction.gnomcpCallArgs.profile, "testnet");

  await client.close();
  await server.close();
});

test("HearthToolbox full mocked MCP workflow (status -> list -> claim -> proof -> settle)", async () => {
  const openBounty = {
    found: true,
    id: 1,
    title: "Implement SVG Reputation Badge",
    spec: "Generate deterministic base64 SVG badges using p/nt/svg/v0.",
    category: "realm",
    status: "open",
    sponsor: "g1sponsor0000000000000000000000000000000",
    claimant: "",
    claim_note: "",
    escrow_ugnot: 2_000_000,
    initial_ugnot: 2_000_000,
    payout_ugnot: 0,
    refund_ugnot: 0,
    reward_formatted: "2.00 GNOT",
    top_up_count: 0,
    deadline_blocks: 50000,
    created_height: 100,
    claimed_height: 0,
    deadline_height: 0,
    submitted_height: 0,
    settled_height: 0,
    proof_url: "",
    proof_digest: "",
    proof_summary: "",
    submission_count: 0,
    revision_feedback: "",
    rating: 0,
    review_note: "",
    dispute_reason: "",
    dispute_opened_by: "",
  };

  const claimedBounty = {
    ...openBounty,
    id: 2,
    status: "claimed",
    claimant: "g1agent000000000000000000000000000000000",
  };

  const submittedBounty = {
    ...claimedBounty,
    id: 3,
    status: "submitted",
    proof_url: "https://github.com/org/repo/pull/9",
    proof_digest: "sha256:abcdef1234567890",
  };

  const mockFetch = makeMockFetch({
    "/status": {
      result: {
        node_info: { network: "onyx-1", moniker: "rpc-public" },
        sync_info: { latest_block_height: "1366700", latest_block_time: "2026-11-24T03:00:00Z", catching_up: false },
      },
    },
    "qpkgmeta_json": encodeAbciString(JSON.stringify({ status: "live" })),
    "ExportStatsJSON": encodeQEvalString(
      JSON.stringify({
        realm_path: "/r/hearth/hearthbounty/v0",
        arbiter: "g1arbiter",
        chain_height: 1366700,
        total_bounties: 3,
        open_count: 1,
        claimed_count: 1,
        submitted_count: 1,
        disputed_count: 0,
        settled_count: 0,
        cancelled_count: 0,
        profile_count: 2,
        agent_count: 1,
        total_escrow_ugnot: 6_000_000,
        total_settled_ugnot: 0,
        total_refund_ugnot: 0,
      }),
    ),
    [Buffer.from('gno.land/r/hearth/hearthbounty/v0.ExportBountyJSON(1)').toString("hex")]: encodeQEvalString(
      JSON.stringify(openBounty),
    ),
    [Buffer.from('gno.land/r/hearth/hearthbounty/v0.ExportBountyJSON(2)').toString("hex")]: encodeQEvalString(
      JSON.stringify(claimedBounty),
    ),
    [Buffer.from('gno.land/r/hearth/hearthbounty/v0.ExportBountyJSON(3)').toString("hex")]: encodeQEvalString(
      JSON.stringify(submittedBounty),
    ),
    "qrender": encodeAbciString("# HearthBounty\n\nLive Board"),
  });

  // Custom router for ExportStatsJSON / ExportBountiesJSON via hex matching.
  const smartFetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/status")) {
      return mockFetch(input);
    }
    const parsed = new URL(url);
    const dataHex = (parsed.searchParams.get("data") ?? "").replace(/^0x/, "");
    const decodedData = dataHex ? Buffer.from(dataHex, "hex").toString("utf8") : "";

    if (url.includes("qpkgmeta_json")) {
      return new Response(JSON.stringify(encodeAbciString(JSON.stringify({ status: "live" }))), { status: 200 });
    }
    if (url.includes("qrender")) {
      return new Response(JSON.stringify(encodeAbciString("# HearthBounty\n\nLive Board")), { status: 200 });
    }
    if (decodedData.includes("ExportStatsJSON()")) {
      return new Response(
        JSON.stringify(
          encodeQEvalString(
            JSON.stringify({
              realm_path: "/r/hearth/hearthbounty/v0",
              arbiter: "g1arbiter",
              chain_height: 1366700,
              total_bounties: 3,
              open_count: 1,
              claimed_count: 1,
              submitted_count: 1,
              disputed_count: 0,
              settled_count: 0,
              cancelled_count: 0,
              profile_count: 2,
              agent_count: 1,
              total_escrow_ugnot: 6_000_000,
              total_settled_ugnot: 0,
              total_refund_ugnot: 0,
            }),
          ),
        ),
        { status: 200 },
      );
    }
    if (decodedData.includes("ExportBountiesJSON(")) {
      return new Response(
        JSON.stringify(encodeQEvalString(JSON.stringify({ chain_height: 1366700, count: 1, bounties: [openBounty] }))),
        { status: 200 },
      );
    }
    if (decodedData.includes("ExportBountyJSON(1)")) {
      return new Response(JSON.stringify(encodeQEvalString(JSON.stringify(openBounty))), { status: 200 });
    }
    if (decodedData.includes("ExportBountyJSON(2)")) {
      return new Response(JSON.stringify(encodeQEvalString(JSON.stringify(claimedBounty))), { status: 200 });
    }
    if (decodedData.includes("ExportBountyJSON(3)")) {
      return new Response(JSON.stringify(encodeQEvalString(JSON.stringify(submittedBounty))), { status: 200 });
    }
    return new Response(JSON.stringify({ error: { message: `Unhandled query: ${decodedData}` } }), { status: 404 });
  }) as typeof fetch;

  const rpc = new GnoRpcClient({ rpcUrl: SAMPLE_CONFIG.rpcUrl, fetchImpl: smartFetch });
  const tools = new HearthToolbox(rpc, SAMPLE_CONFIG);

  const status = await tools.chainStatus();
  assert.equal(status.node.network, "onyx-1");
  assert.equal(status.packageStatus, "live");
  assert.equal(status.stats.total_escrow_ugnot, 6_000_000);

  const listed = await tools.listBounties({ status: "open", category: "realm" });
  assert.equal(listed.count, 1);
  assert.equal(listed.bounties[0].id, 1);

  const postTx = tools.preparePostBounty({
    title: "Add JSON Schema Docs",
    spec: "Document all HearthBounty vm/qeval JSON schemas for AI agents.",
    category: "docs",
    rewardUgnot: 1_500_000,
  });
  assert.equal(postTx.rewardFormatted, "1.50 GNOT");
  assert.equal(postTx.transaction.send, "1500000ugnot");
  assert.equal(postTx.transaction.gnomcpCallArgs.profile, "testnet");

  const claimTx = await tools.prepareClaim({ id: 1, agentNote: "Claiming via MCP" });
  assert.equal(claimTx.transaction.func, "ClaimBounty");
  assert.deepEqual(claimTx.transaction.args, ["1", "Claiming via MCP"]);

  const proofTx = await tools.prepareSubmitProof({
    id: 2,
    proofURL: "https://github.com/hearthbounty/demo/pull/7",
    proofContent: "deterministic-artifact-payload",
    summary: "Implemented and verified with 100% gno test pass.",
  });
  assert.equal(proofTx.transaction.func, "SubmitProof");
  assert.match(proofTx.computedDigest, /^sha256:[0-9a-f]{64}$/);

  const settleTx = await tools.prepareSettle({ id: 3, rating: 5, reviewNote: "Flawless work!" });
  assert.equal(settleTx.payoutUgnot, 2_000_000);
  assert.equal(settleTx.transaction.func, "ApproveAndSettle");

  const rendered = await tools.renderPage("");
  assert.match(rendered.markdown, /# HearthBounty/);
});
