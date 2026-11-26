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
  DEFAULT_V1_REALM_ADDRESS,
  ESCROW_TOKEN_KEY,
  formatUgnotAsGnot,
  HearthConfig,
  HearthToolbox,
  MAX_ESCROW_UGNOT,
  shellQuote,
} from "../src/tools.js";

const SAMPLE_CONFIG: HearthConfig = {
  rpcUrl: "https://rpc.onyx.testnets.gno.land:443",
  chainId: "onyx-1",
  realmPath: "gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1",
  gnowebBaseUrl: "https://onyx.testnets.gno.land",
  escrowRealmAddress: DEFAULT_V1_REALM_ADDRESS,
};

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
  assert.equal(
    computeProofDigest("abc"),
    "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(formatUgnotAsGnot(1_000_000), "1.00 GNOT");
  assert.equal(formatUgnotAsGnot(2_500_000), "2.50 GNOT");
  assert.equal(formatUgnotAsGnot(123_456), "0.123456 GNOT");
});

test("MCP server registers all 12 tools and executes PostBounty wugnot prep over MCP protocol", async () => {
  const server = createHearthMcpServer(SAMPLE_CONFIG);
  const client = new Client({ name: "hearth-test-client", version: "1.1.0" });
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
    "hearth_prepare_expire_dispute",
    "hearth_prepare_expire_submission",
    "hearth_prepare_post_bounty",
    "hearth_prepare_settle",
    "hearth_prepare_submit_proof",
    "hearth_render_page",
  ]);

  const callRes = await client.callTool({
    name: "hearth_prepare_post_bounty",
    arguments: {
      title: "MCP Protocol Test Bounty",
      spec: "Verify that hearthbounty-mcp builds wugnot pre-steps and a valid PostBounty payload over MCP.",
      category: "agent",
      rewardUgnot: 2_000_000,
    },
  });
  const firstText = (callRes.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
  const parsed = JSON.parse(firstText) as {
    rewardFormatted: string;
    escrowToken: string;
    escrowPreSteps: Array<{ func: string; pkgPath: string }>;
    transaction: { func: string; args: string[]; gnomcpCallArgs: { profile: string } };
  };
  assert.equal(parsed.rewardFormatted, "2.00 GNOT");
  assert.equal(parsed.escrowToken, ESCROW_TOKEN_KEY);
  assert.equal(parsed.escrowPreSteps.length, 2);
  assert.equal(parsed.escrowPreSteps[0].func, "Deposit");
  assert.equal(parsed.escrowPreSteps[1].func, "Approve");
  assert.equal(parsed.transaction.func, "PostBounty");
  assert.equal(parsed.transaction.args[3], "2000000");
  assert.equal(parsed.transaction.gnomcpCallArgs.profile, "testnet");

  await client.close();
  await server.close();
});

test("HearthToolbox full mocked MCP workflow (status -> list -> claim -> https-only proof -> settle -> timeout expiry)", async () => {
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
    sponsor_funded_ugnot: 2_000_000,
    external_top_up_ugnot: 0,
    external_donor_count: 0,
    payout_ugnot: 0,
    refund_ugnot: 0,
    reward_formatted: "2.00 GNOT",
    top_up_count: 0,
    deadline_blocks: 50000,
    created_height: 100,
    claimed_height: 0,
    deadline_height: 0,
    submitted_height: 0,
    review_deadline_height: 0,
    disputed_height: 0,
    dispute_deadline_height: 0,
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
    review_deadline_height: 1_428_958,
    proof_url: "https://github.com/org/repo/pull/9",
    proof_digest: "sha256:abcdef1234567890",
  };

  const disputedBounty = {
    ...submittedBounty,
    id: 4,
    status: "disputed",
    dispute_deadline_height: 1_430_000,
  };

  const smartFetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/status")) {
      return new Response(
        JSON.stringify({
          result: {
            node_info: { network: "onyx-1", moniker: "rpc-public" },
            sync_info: { latest_block_height: "1378960", latest_block_time: "2026-11-24T14:43:19Z", catching_up: false },
          },
        }),
        { status: 200 },
      );
    }
    const parsed = new URL(url);
    const dataHex = (parsed.searchParams.get("data") ?? "").replace(/^0x/, "");
    const decodedData = dataHex ? Buffer.from(dataHex, "hex").toString("utf8") : "";

    if (url.includes("qpkgmeta_json")) {
      return new Response(JSON.stringify(encodeAbciString(JSON.stringify({ status: "live" }))), { status: 200 });
    }
    if (url.includes("qrender")) {
      return new Response(JSON.stringify(encodeAbciString("# HearthBounty v1\n\nLive Board")), { status: 200 });
    }
    if (decodedData.includes("ExportStatsJSON()")) {
      return new Response(
        JSON.stringify(
          encodeQEvalString(
            JSON.stringify({
              realm_path: SAMPLE_CONFIG.realmPath,
              web_path: "/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1",
              escrow_token: ESCROW_TOKEN_KEY,
              escrow_address: DEFAULT_V1_REALM_ADDRESS,
              arbiter: "g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4",
              chain_height: 1378960,
              total_bounties: 4,
              open_count: 1,
              claimed_count: 1,
              submitted_count: 1,
              disputed_count: 1,
              settled_count: 0,
              cancelled_count: 0,
              profile_count: 2,
              agent_count: 1,
              total_escrow_ugnot: 8_000_000,
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
        JSON.stringify(encodeQEvalString(JSON.stringify({ chain_height: 1378960, count: 1, bounties: [openBounty] }))),
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
    if (decodedData.includes("ExportBountyJSON(4)")) {
      return new Response(JSON.stringify(encodeQEvalString(JSON.stringify(disputedBounty))), { status: 200 });
    }
    return new Response(JSON.stringify({ error: { message: `Unhandled query: ${decodedData}` } }), { status: 404 });
  }) as typeof fetch;

  const rpc = new GnoRpcClient({ rpcUrl: SAMPLE_CONFIG.rpcUrl, fetchImpl: smartFetch });
  const tools = new HearthToolbox(rpc, SAMPLE_CONFIG);

  const status = await tools.chainStatus();
  assert.equal(status.node.network, "onyx-1");
  assert.equal(status.packageStatus, "live");
  assert.equal(status.stats.total_escrow_ugnot, 8_000_000);

  const listed = await tools.listBounties({ status: "open", category: "realm" });
  assert.equal(listed.count, 1);
  assert.equal(listed.bounties[0].id, 1);

  const postTx = tools.preparePostBounty({
    title: "Add JSON Schema Docs",
    spec: "Document all HearthBounty v1 vm/qeval JSON schemas for AI agents.",
    category: "docs",
    rewardUgnot: 1_500_000,
  });
  assert.equal(postTx.rewardFormatted, "1.50 GNOT");
  assert.equal(postTx.escrowPreSteps[0].send, "1500000ugnot");
  assert.equal(postTx.transaction.args[3], "1500000");

  const claimTx = await tools.prepareClaim({ id: 1, agentNote: "Claiming via MCP" });
  assert.equal(claimTx.transaction.func, "ClaimBounty");
  assert.deepEqual(claimTx.transaction.args, ["1", "Claiming via MCP"]);

  // Rejects non-https URLs (ipfs:// and http://) matching hearthbounty/v1 ValidateProofURL.
  await assert.rejects(
    () =>
      tools.prepareSubmitProof({
        id: 2,
        proofURL: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        proofContent: "test",
        summary: "Attempting unsupported ipfs scheme.",
      }),
    /https:\/\//,
  );

  const proofTx = await tools.prepareSubmitProof({
    id: 2,
    proofURL: "https://github.com/hearthbounty/demo/pull/7",
    proofContent: "deterministic-artifact-payload",
    summary: "Implemented and verified with 100% gno test pass.",
  });
  assert.equal(proofTx.transaction.func, "SubmitProof");
  assert.match(proofTx.computedDigest, /^sha256:[0-9a-f]{64}$/);

  const settleTx = await tools.prepareSettle({ id: 3, rating: 5, reviewNote: "Clean work." });
  assert.equal(settleTx.payoutUgnot, 2_000_000);
  assert.equal(settleTx.transaction.func, "ApproveAndSettle");

  const expSubTx = await tools.prepareExpireSubmission({ id: 3 });
  assert.equal(expSubTx.transaction.func, "ExpireSubmission");
  assert.equal(expSubTx.reviewDeadlineHeight, 1_428_958);

  const expDispTx = await tools.prepareExpireDispute({ id: 4 });
  assert.equal(expDispTx.transaction.func, "ExpireDispute");
  assert.equal(expDispTx.fallbackSplitBps, 5000);

  const rendered = await tools.renderPage("");
  assert.match(rendered.markdown, /# HearthBounty v1/);
});

test("assertWritableChain blocks mainnet variations, whitespace, and unrecognized chains", () => {
  for (const bad of ["gnoland-1", " GNOLAND-1 ", "mainnet", "Mainnet", "", "   ", "cosmos-1"]) {
    assert.throws(() => assertWritableChain(bad), /Safety block/, `expected block for ${JSON.stringify(bad)}`);
  }
  for (const good of ["dev", " DEV ", "onyx-1", "test18", "testnet-local"]) {
    assert.doesNotThrow(() => assertWritableChain(good), `expected allow for ${JSON.stringify(good)}`);
  }
});

test("preparePostBounty enforces title, spec, category, reward floor/ceiling, deadline bounds, and mainnet block", () => {
  const rpc = new GnoRpcClient({ rpcUrl: SAMPLE_CONFIG.rpcUrl });
  const tools = new HearthToolbox(rpc, SAMPLE_CONFIG);

  assert.throws(
    () =>
      tools.preparePostBounty({
        title: "abc",
        spec: "Long enough specification text.",
        category: "realm",
        rewardUgnot: 500_000,
      }),
    /Title must be 4-120/,
  );
  assert.throws(
    () =>
      tools.preparePostBounty({
        title: "Valid Title",
        spec: "too short",
        category: "realm",
        rewardUgnot: 500_000,
      }),
    /Specification must be 10-4000/,
  );
  assert.throws(
    () =>
      tools.preparePostBounty({
        title: "Valid Title",
        spec: "Long enough specification text.",
        category: "realm",
        rewardUgnot: 99_999,
      }),
    /rewardUgnot must be an integer/,
  );
  assert.throws(
    () =>
      tools.preparePostBounty({
        title: "Valid Title",
        spec: "Long enough specification text.",
        category: "realm",
        rewardUgnot: MAX_ESCROW_UGNOT + 1,
      }),
    /rewardUgnot must be an integer/,
  );
  assert.throws(
    () =>
      tools.preparePostBounty({
        title: "Valid Title",
        spec: "Long enough specification text.",
        category: "realm",
        rewardUgnot: 500_000,
        deadlineBlocks: 9,
      }),
    /deadlineBlocks must be between/,
  );

  const mainnetTools = new HearthToolbox(rpc, { ...SAMPLE_CONFIG, chainId: "gnoland-1" });
  assert.throws(
    () =>
      mainnetTools.preparePostBounty({
        title: "Mainnet Write Attempt",
        spec: "Mainnet writes must always be refused.",
        category: "audit",
        rewardUgnot: 500_000,
      }),
    /Safety block/,
  );
});

test("shellQuote neutralizes single quotes and shell metacharacters in gnokey commands", () => {
  const hostile = `evil'; rm -rf /; $(whoami) \`id\``;
  const quoted = shellQuote(hostile);
  assert.equal(quoted, `'evil'\\''` + `; rm -rf /; $(whoami) \`id\`'`);
  assert.ok(quoted.startsWith("'") && quoted.endsWith("'"));
});

test("prepareSubmitProof enforces HTTPS-only URLs, whitespace ban, digest/content requirement, and summary length", async () => {
  const mockFetch = (async () =>
    new Response(
      JSON.stringify(
        encodeQEvalString(
          JSON.stringify({
            found: true,
            id: 2,
            status: "claimed",
            claimant: "g1agent000000000000000000000000000000000",
          }),
        ),
      ),
    )) as typeof fetch;
  const tools = new HearthToolbox(new GnoRpcClient({ rpcUrl: SAMPLE_CONFIG.rpcUrl, fetchImpl: mockFetch }), SAMPLE_CONFIG);

  for (const badUrl of [
    "http://insecure.example.com/pr/1",
    "javascript:alert(1)",
    "https://a.b",
    "https://github.com/org/repo/pull/1 injected",
  ]) {
    await assert.rejects(
      () =>
        tools.prepareSubmitProof({
          id: 2,
          proofURL: badUrl,
          proofContent: "artifact",
          summary: "Valid summary string.",
        }),
      /proofURL must be a valid https:\/\//,
    );
  }

  await assert.rejects(
    () =>
      tools.prepareSubmitProof({
        id: 2,
        proofURL: "https://github.com/org/repo/pull/1",
        summary: "Valid summary string.",
      }),
    /Provide either proofDigest/,
  );

  await assert.rejects(
    () =>
      tools.prepareSubmitProof({
        id: 2,
        proofURL: "https://github.com/org/repo/pull/1",
        proofContent: "artifact",
        summary: "short",
      }),
    /summary must be at least 6/,
  );
});

test("Write-prep tools reject not-found bounties and mismatched lifecycle states", async () => {
  const mockFetch = (async (input: RequestInfo | URL) => {
    const parsed = new URL(String(input));
    const decoded = Buffer.from((parsed.searchParams.get("data") ?? "").replace(/^0x/, ""), "hex").toString("utf8");
    if (decoded.includes("ExportBountyJSON(99)")) {
      return new Response(JSON.stringify(encodeQEvalString(JSON.stringify({ found: false }))));
    }
    return new Response(
      JSON.stringify(
        encodeQEvalString(
          JSON.stringify({
            found: true,
            id: 1,
            status: "settled",
            escrow_ugnot: 0,
            sponsor: "g1s",
            claimant: "g1c",
          }),
        ),
      ),
    );
  }) as typeof fetch;

  const tools = new HearthToolbox(new GnoRpcClient({ rpcUrl: SAMPLE_CONFIG.rpcUrl, fetchImpl: mockFetch }), SAMPLE_CONFIG);

  await assert.rejects(() => tools.prepareClaim({ id: 99, agentNote: "Missing" }), /was not found/);
  await assert.rejects(() => tools.prepareClaim({ id: 1, agentNote: "Settled" }), /not "open"/);
  await assert.rejects(() => tools.prepareSettle({ id: 1, rating: 5, reviewNote: "Settled" }), /expected "submitted"/);
  await assert.rejects(() => tools.prepareSettle({ id: 1, rating: 0, reviewNote: "Bad rating" }), /between 1 and 5/);
  await assert.rejects(() => tools.prepareExpireSubmission({ id: 1 }), /expected "submitted"/);
  await assert.rejects(() => tools.prepareExpireDispute({ id: 1 }), /expected "disputed"/);
});

test("GnoRpcClient surfaces HTTP, RPC, ABCI, and malformed vm/qeval tuple errors cleanly", async () => {
  assert.throws(() => decodeQEvalStringResult("(123 int)"), /Unexpected vm\/qeval string output/);

  const http500 = new GnoRpcClient({
    rpcUrl: "https://mock.local",
    fetchImpl: (async () => new Response("err", { status: 500 })) as typeof fetch,
  });
  await assert.rejects(() => http500.getStatus(), /HTTP 500/);

  const rpcErr = new GnoRpcClient({
    rpcUrl: "https://mock.local",
    fetchImpl: (async () => new Response(JSON.stringify({ error: { message: "boom" } }))) as typeof fetch,
  });
  await assert.rejects(() => rpcErr.abciQuery("vm/qeval", "x"), /ABCI RPC error.*boom/);

  const abciErr = new GnoRpcClient({
    rpcUrl: "https://mock.local",
    fetchImpl: (async () =>
      new Response(JSON.stringify({ result: { response: { ResponseBase: { Error: "vm panic", Log: "bounty not found" } } } }))) as typeof fetch,
  });
  await assert.rejects(() => abciErr.abciQuery("vm/qeval", "x"), /ABCI query failed.*bounty not found/);

  const absentMeta = new GnoRpcClient({
    rpcUrl: "https://mock.local",
    fetchImpl: (async () =>
      new Response(JSON.stringify({ result: { response: { ResponseBase: { Data: "" } } } }))) as typeof fetch,
  });
  const meta = await absentMeta.queryPackageMeta("gno.land/r/none/v0");
  assert.equal(meta.status, "absent");
});

test("Read helpers enforce positive bounty IDs, non-empty profile addresses, and safe limit clamping", async () => {
  const seenExprs: string[] = [];
  const mockFetch = (async (input: RequestInfo | URL) => {
    const parsed = new URL(String(input));
    const decoded = Buffer.from((parsed.searchParams.get("data") ?? "").replace(/^0x/, ""), "hex").toString("utf8");
    seenExprs.push(decoded);
    if (decoded.includes("ExportLeaderboardJSON")) {
      return new Response(JSON.stringify(encodeQEvalString(JSON.stringify({ count: 0, leaderboard: [] }))));
    }
    if (decoded.includes("ExportProfileJSON")) {
      return new Response(JSON.stringify(encodeQEvalString(JSON.stringify({ found: true, handle: "smith" }))));
    }
    return new Response(JSON.stringify(encodeQEvalString(JSON.stringify({ chain_height: 1, count: 0, bounties: [] }))));
  }) as typeof fetch;

  const tools = new HearthToolbox(new GnoRpcClient({ rpcUrl: SAMPLE_CONFIG.rpcUrl, fetchImpl: mockFetch }), SAMPLE_CONFIG);

  await assert.rejects(() => tools.getBounty(0), /positive integer/);
  await assert.rejects(() => tools.getBounty(-2), /positive integer/);
  await assert.rejects(() => tools.getProfile("   "), /Address is required/);

  await tools.listBounties({ status: " OPEN ", minRewardUgnot: -50, limit: 999 });
  await tools.getLeaderboard(0);
  const prof = await tools.getProfile("g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4");
  assert.equal(prof.handle, "smith");

  assert.ok(seenExprs.some((e) => e.includes(`ExportBountiesJSON("open", "", 0, 100)`)));
  assert.ok(seenExprs.some((e) => e.includes(`ExportLeaderboardJSON(1)`)));
});
