import assert from "node:assert/strict";
import test from "node:test";
import { BREAKER_TESTS, runBreakerTest } from "../src/breaker.js";
import {
  computeSha256Digest,
  computeSplit,
  computeTier,
  createSeededRealm,
  DEMO_ACTORS,
  DENOM,
  formatGNOT,
  HearthBountyRealm,
  legacyVulnerableNeutralizeGnoTagsV0,
  MAX_ESCROW_UGNOT,
  MAX_EXTERNAL_DONORS,
  neutralizeGnoTags,
  sanitizeRenderText,
  validateDeadlineBlocks,
  validateProofURL,
  validateRating,
} from "../src/engine.js";
import { runDiagnostics } from "../src/diag.js";
import { assertWritableChain, executeMcpTool, MCP_TOOLS } from "../src/mcp.js";
import { fetchLiveOnyxSnapshot, ONYX_ARTIFACTS, queryLiveRender } from "../src/onyx.js";
import { renderEscrowDistributionSVG, renderLifecycleSVG } from "../src/svg.js";

test("Engine pure math matches hearthcore/v0 ComputeSplit and ComputeTier", () => {
  const big = computeSplit(9_000_000_000_000_000, 3_333);
  assert.equal(big.hunterUgnot, 2_999_700_000_000_000);
  assert.equal(big.sponsorRefundUgnot, 6_000_300_000_000_000);
  assert.equal(big.hunterUgnot + big.sponsorRefundUgnot, 9_000_000_000_000_000);

  assert.equal(formatGNOT(2_500_000), "2.50 GNOT");
  assert.equal(formatGNOT(123_456), "0.123456 GNOT");
  assert.equal(computeTier(10, 50_000_000, 48, 10), "Guildmaster");
  assert.equal(computeTier(10, 50_000_000, 30, 10), "Master");
});

test("Seeded realm mirrors hearthbounty/v1 custody split, tiers, and escrow invariant", () => {
  const realm = createSeededRealm();
  const stats = realm.getStats();
  assert.equal(stats.total_bounties, 5);
  assert.equal(stats.open_count, 2);
  assert.equal(stats.claimed_count, 1);
  assert.equal(stats.submitted_count, 1);
  assert.equal(stats.settled_count, 1);
  assert.equal(stats.total_settled_ugnot, 12_000_000);
  assert.equal(stats.total_escrow_ugnot, 17_200_000);
  assert.equal(realm.assertEscrowInvariant(), true);

  const b5 = realm.bounties.get(5)!;
  assert.equal(b5.sponsorFundedUgnot, 4_800_000);
  assert.equal(b5.externalTopUpUgnot, 1_200_000);
  assert.equal(realm.getDonorContribution(5, DEMO_ACTORS[2].address), 1_200_000);

  const agentProfile = realm.toProfileView(realm.profiles.get(DEMO_ACTORS[1].address)!);
  assert.equal(agentProfile.tier, "Journeyman");
  assert.equal(agentProfile.isAgent, true);
});

test("Adversarial Breaker Lab executes and defends all 4 V2.1 exploit suites", () => {
  assert.equal(BREAKER_TESTS.length, 4);
  for (const spec of BREAKER_TESTS) {
    const res = runBreakerTest(spec.id);
    assert.equal(res.passed, true, `Breaker test ${spec.id} failed: ${res.headline}`);
    assert.ok(res.steps.length >= 3);
  }
});

test("Full MCP emulator executes all 12 tools, enforces HTTPS-only proofs, and blocks gnoland-1 writes", async () => {
  const realm = createSeededRealm();
  assert.equal(MCP_TOOLS.length, 12);

  assert.throws(() => assertWritableChain("gnoland-1"), /Safety block/);
  assert.throws(() => assertWritableChain("mainnet"), /Safety block/);
  assert.doesNotThrow(() => assertWritableChain("onyx-1"));

  const status = await executeMcpTool(realm, "hearth_chain_status", {}, "onyx-1");
  assert.equal(status.ok, true);
  assert.equal((status.response as { packageStatus: string }).packageStatus, "in-browser-emulator");

  const list = await executeMcpTool(realm, "hearth_list_bounties", { status: "open" }, "onyx-1");
  assert.equal(list.ok, true);
  assert.equal((list.response as { count: number }).count, 2);

  const badProof = await executeMcpTool(
    realm,
    "hearth_prepare_submit_proof",
    {
      id: 3,
      proofURL: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      proofContent: "abc",
      summary: "Attempting ipfs link.",
    },
    "onyx-1",
  );
  assert.equal(badProof.ok, false);
  assert.match(badProof.error ?? "", /https:\/\//);

  const proof = await executeMcpTool(
    realm,
    "hearth_prepare_submit_proof",
    {
      id: 3,
      proofURL: "https://github.com/alphonshhhomenicmtu/hearthbounty/pull/9",
      proofContent: "abc",
      summary: "NIST SHA-256 test vector submission.",
    },
    "onyx-1",
  );
  assert.equal(proof.ok, true);
  assert.equal(
    (proof.response as { computedDigest: string }).computedDigest,
    "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );

  const blocked = await executeMcpTool(
    realm,
    "hearth_prepare_post_bounty",
    {
      title: "Blocked Mainnet Write",
      spec: "Mainnet write preparation must be refused by safety guard.",
      category: "audit",
      rewardUgnot: 500_000,
    },
    "gnoland-1",
  );
  assert.equal(blocked.ok, false);
  assert.match(blocked.error ?? "", /Safety block/);
});

test("Unicode U+0130 sanitizer fix, SHA-256 helper, SVG mirror, and /diag self-test suite pass 100%", async () => {
  const payload = `İ<gno-form exec="PostBounty">\n</gno-form> $GNOT`;
  assert.equal(legacyVulnerableNeutralizeGnoTagsV0(payload).includes("<gno-form"), true);
  const clean = sanitizeRenderText(payload);
  assert.equal(clean.includes("<gno-form"), false);
  assert.equal(clean.includes("\\$GNOT"), true);

  const sha = await computeSha256Digest("abc");
  assert.equal(sha, "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");

  const realm = createSeededRealm();
  const distSvg = renderEscrowDistributionSVG(realm.getStats());
  assert.match(distSvg, /<svg/);
  const lifeSvg = renderLifecycleSVG("submitted", 5_500_000);
  assert.match(lifeSvg, /5\.50 GNOT/);

  const diag = await runDiagnostics({ skipLiveOnyx: true });
  assert.equal(diag.failed, 0);
  assert.equal(diag.passed, 9);
});

test("Double-claim and terminal-state replays abort without mutating balances or escrow invariant", () => {
  const [sponsor, agent, builder, arbiter] = DEMO_ACTORS;
  const r = new HearthBountyRealm(arbiter.address, 500);
  r.seedBalances();

  assert.throws(() => r.claimBounty({ caller: agent.address }, 0, "missing"), /bounty not found/);
  assert.throws(() => r.claimBounty({ caller: agent.address }, 999, "missing"), /bounty not found/);

  const id1 = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
    "Double-Claim Guard",
    "Verify second claim and post-settle replays abort cleanly.",
    "audit",
    30,
  );
  r.claimBounty({ caller: agent.address }, id1, "First claim");
  assert.throws(() => r.claimBounty({ caller: agent.address }, id1, "Retry"), /not open for claiming/);
  assert.throws(() => r.claimBounty({ caller: builder.address }, id1, "Compete"), /not open for claiming/);

  r.submitProof(
    { caller: agent.address },
    id1,
    "https://github.com/alphonshhhomenicmtu/hearthbounty/pull/101",
    "sha256:aaaaaaaaaaaaaaaa",
    "Submitted deliverable.",
  );
  const balBefore = r.getBalance(agent.address);
  r.approveAndSettle({ caller: sponsor.address }, id1, 5, "Settled once.");
  assert.equal(r.getBalance(agent.address), balBefore + 1_000_000);

  assert.throws(() => r.approveAndSettle({ caller: sponsor.address }, id1, 5, "Double settle"), /not awaiting approval/);
  assert.throws(() => r.expireSubmission({ caller: builder.address }, id1), /no pending submission/);
  assert.throws(() => r.cancelBounty({ caller: sponsor.address }, id1), /only open bounties/);
  assert.throws(() => r.openDispute({ caller: sponsor.address }, id1, "Late dispute"), /only be opened on submitted/);
  assert.throws(
    () => r.topUpBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 100_000 }] }, id1),
    /only top up open or claimed/,
  );
  assert.equal(r.assertEscrowInvariant(), true);

  const id2 = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] },
    "Cancel Replay Guard",
    "Verify cancelled bounty cannot be cancelled again or claimed.",
    "tool",
    20,
  );
  r.cancelBounty({ caller: sponsor.address }, id2);
  assert.throws(() => r.cancelBounty({ caller: sponsor.address }, id2), /only open bounties/);
  assert.throws(() => r.claimBounty({ caller: builder.address }, id2, "Claim cancelled"), /not open for claiming/);
  assert.equal(r.assertEscrowInvariant(), true);
  assert.equal(r.totalEscrowUgnot, 0);
});

test("Unauthorized access matrix blocks non-owners, invalid ratings, and conflicted sponsor-arbiter", () => {
  const [sponsor, agent, builder, arbiter] = DEMO_ACTORS;
  const r = new HearthBountyRealm(arbiter.address, 500);
  r.seedBalances();

  assert.throws(() => r.setArbiter({ caller: builder.address }, builder.address), /only current arbiter/);
  assert.throws(() => r.setArbiter({ caller: arbiter.address }, "invalid"), /address is invalid/);

  const id = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
    "Access Control Quest",
    "Test role separation on every crossing entrypoint.",
    "audit",
    25,
  );
  r.topUpBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 200_000 }] }, id);
  assert.throws(() => r.cancelBounty({ caller: builder.address }, id), /only the sponsor may cancel/);
  assert.throws(() => r.cancelBounty({ caller: agent.address }, id), /only the sponsor may cancel/);

  r.claimBounty({ caller: agent.address }, id, "Claiming");
  assert.throws(
    () => r.submitProof({ caller: sponsor.address }, id, "https://github.com/org/repo/pull/1", "sha256:12345678", "Bad caller"),
    /only the active claimant/,
  );
  r.submitProof({ caller: agent.address }, id, "https://github.com/org/repo/pull/1", "sha256:12345678", "Valid proof.");

  assert.throws(() => r.requestRevision({ caller: agent.address }, id, "Self revise"), /only the sponsor/);
  assert.throws(() => r.approveAndSettle({ caller: agent.address }, id, 5, "Self settle"), /only the sponsor/);
  assert.throws(() => r.approveAndSettle({ caller: sponsor.address }, id, 0, "Zero rating"), /between 1 and 5/);
  assert.throws(() => r.approveAndSettle({ caller: sponsor.address }, id, 6, "Six rating"), /between 1 and 5/);
  assert.throws(() => r.openDispute({ caller: builder.address }, id, "Third-party dispute"), /only sponsor or claimant/);

  r.openDispute({ caller: sponsor.address }, id, "Sponsor opens dispute.");
  assert.throws(() => r.resolveDispute({ caller: sponsor.address }, id, 5000, "Not arbiter"), /only the arbiter/);
  assert.throws(() => r.resolveDispute({ caller: arbiter.address }, id, 10_001, "Bad bps"), /exceeds 10000/);

  // Sponsor promoted to arbiter -> conflict guard still blocks self-resolution.
  r.setArbiter({ caller: arbiter.address }, sponsor.address);
  assert.throws(
    () => r.resolveDispute({ caller: sponsor.address }, id, 0, "Sponsor self refund"),
    /arbiter cannot resolve a bounty they are party to/,
  );
  assert.equal(r.assertEscrowInvariant(), true);
});

test("Multi-donor pro-rata dispute splits conserve exact 1-wugnot totals across prime amounts", () => {
  const [sponsor, agent, donor1, arbiter] = DEMO_ACTORS;
  const donor2 = "g1donor222222222222222222222222222222222";
  const donor3 = "g1donor333333333333333333333333333333333";
  const r = new HearthBountyRealm(arbiter.address, 500);
  r.seedBalances();
  r.balances.set(donor2, 50_000_000);
  r.balances.set(donor3, 50_000_000);

  const bpsCases = [0, 1, 333, 3333, 5000, 6667, 9999, 10_000];
  const spAmt = 100_001;
  const d1Amt = 100_003;
  const d2Amt = 100_007;
  const d3Amt = 100_009;
  const total = spAmt + d1Amt + d2Amt + d3Amt;

  let expectedSettled = 0;
  for (const bps of bpsCases) {
    const id = r.postBounty(
      { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: spAmt }] },
      `Prime Conservation ${bps}`,
      "Verify exact conservation across 4 prime-amount contributors.",
      "audit",
      20,
    );
    r.topUpBounty({ caller: donor1.address, sentCoins: [{ denom: DENOM, amount: d1Amt }] }, id);
    r.topUpBounty({ caller: donor2, sentCoins: [{ denom: DENOM, amount: d2Amt }] }, id);
    r.topUpBounty({ caller: donor3, sentCoins: [{ denom: DENOM, amount: d3Amt }] }, id);
    r.claimBounty({ caller: agent.address }, id, "Prime test");
    r.submitProof({ caller: agent.address }, id, "https://github.com/org/repo/pull/2", "sha256:bbbbbbbb", "Prime proof.");
    r.openDispute({ caller: agent.address }, id, "Prime split test.");

    const hBefore = r.getBalance(agent.address);
    const sBefore = r.getBalance(sponsor.address);
    const d1Before = r.getBalance(donor1.address);
    const d2Before = r.getBalance(donor2);
    const d3Before = r.getBalance(donor3);

    r.resolveDispute({ caller: arbiter.address }, id, bps, "Prime split");

    const hDelta = r.getBalance(agent.address) - hBefore;
    const sDelta = r.getBalance(sponsor.address) - sBefore;
    const d1Delta = r.getBalance(donor1.address) - d1Before;
    const d2Delta = r.getBalance(donor2) - d2Before;
    const d3Delta = r.getBalance(donor3) - d3Before;

    assert.equal(hDelta + sDelta + d1Delta + d2Delta + d3Delta, total);
    if (bps === 0) assert.equal(hDelta, 0);
    if (bps === 10_000) assert.equal(hDelta, total);
    if (hDelta > 0) expectedSettled += 1;
    assert.equal(r.profiles.get(agent.address)?.settledCount, expectedSettled);
    assert.equal(r.assertEscrowInvariant(), true);
  }
  assert.equal(r.totalEscrowUgnot, 0);
});

test("External donor cap (20), repeat donor top-ups, and MaxEscrowUgnot overflow ceiling", () => {
  const [sponsor, , , arbiter] = DEMO_ACTORS;
  const r = new HearthBountyRealm(arbiter.address, 500);
  r.seedBalances();
  r.balances.set(sponsor.address, MAX_ESCROW_UGNOT * 2);

  assert.throws(
    () =>
      r.postBounty(
        { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 0 }] },
        "Zero Escrow",
        "Zero escrow must abort cleanly.",
        "tool",
        20,
      ),
    /below minimum required/,
  );
  assert.throws(
    () =>
      r.postBounty(
        { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: MAX_ESCROW_UGNOT + 1 }] },
        "Overflow Escrow",
        "Above ceiling must abort cleanly.",
        "tool",
        20,
      ),
    /exceeds single-bounty safety ceiling/,
  );

  const id = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] },
    "Donor Cap Quest",
    "Fill all 20 external donor slots and verify 21st aborts.",
    "realm",
    50,
  );
  r.topUpBounty({ caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 300_000 }] }, id);
  assert.equal(r.bounties.get(id)?.sponsorFundedUgnot, 800_000);

  const donors: string[] = [];
  for (let i = 0; i < MAX_EXTERNAL_DONORS; i += 1) {
    const addr = `g1donorcap${String(i).padStart(2, "0")}000000000000000000000000000`;
    donors.push(addr);
    r.balances.set(addr, 1_000_000);
    r.topUpBounty({ caller: addr, sentCoins: [{ denom: DENOM, amount: 100_000 }] }, id);
  }

  const donor21 = "g1donorcap21000000000000000000000000000";
  r.balances.set(donor21, 1_000_000);
  assert.throws(
    () => r.topUpBounty({ caller: donor21, sentCoins: [{ denom: DENOM, amount: 100_000 }] }, id),
    /external donor cap reached/,
  );

  // Existing donor #0 can top up again without hitting cap.
  r.topUpBounty({ caller: donors[0], sentCoins: [{ denom: DENOM, amount: 150_000 }] }, id);
  assert.equal(r.getDonorContribution(id, donors[0]), 250_000);

  const spBefore = r.getBalance(sponsor.address);
  const d0Before = r.getBalance(donors[0]);
  r.cancelBounty({ caller: sponsor.address }, id);
  assert.equal(r.getBalance(sponsor.address), spBefore + 800_000);
  assert.equal(r.getBalance(donors[0]), d0Before + 250_000);
  assert.equal(r.assertEscrowInvariant(), true);
});

test("Exact off-by-one timeout boundaries for claim, review, and dispute expiry", () => {
  const [sponsor, agent, builder, arbiter] = DEMO_ACTORS;
  const r = new HearthBountyRealm(arbiter.address, 1000);
  r.seedBalances();

  // Claim expiry: DeadlineHeight - 1 blocked, exact DeadlineHeight allowed.
  const id1 = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] },
    "Off-By-One Claim Expiry",
    "Verify claim release boundary at exact DeadlineHeight.",
    "docs",
    20,
  );
  r.claimBounty({ caller: builder.address }, id1, "Working");
  const dl1 = r.bounties.get(id1)!.deadlineHeight;
  r.advanceBlocks(dl1 - r.chainHeight - 1);
  assert.throws(() => r.releaseExpiredClaim({ caller: agent.address }, id1), /has not expired yet/);
  r.advanceBlocks(1);
  r.releaseExpiredClaim({ caller: agent.address }, id1);
  assert.equal(r.bounties.get(id1)?.status, "open");

  // Review expiry: ReviewDeadlineHeight - 1 blocked, exact ReviewDeadlineHeight auto-settles unrated.
  r.claimBounty({ caller: agent.address }, id1, "Reclaiming");
  r.submitProof({ caller: agent.address }, id1, "https://github.com/org/repo/pull/3", "sha256:cccccccc", "Delivered work.");
  const rdl = r.bounties.get(id1)!.reviewDeadlineHeight;
  r.advanceBlocks(rdl - r.chainHeight - 1);
  assert.throws(() => r.expireSubmission({ caller: builder.address }, id1), /review window has not expired/);
  r.advanceBlocks(1);
  r.expireSubmission({ caller: builder.address }, id1);
  assert.equal(r.bounties.get(id1)?.status, "settled");
  assert.equal(r.bounties.get(id1)?.rating, 0);

  // Dispute expiry: DisputeDeadlineHeight - 1 blocked, exact DisputeDeadlineHeight splits 50/50.
  const id2 = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 800_000 }] },
    "Off-By-One Dispute Expiry",
    "Verify dispute timeout boundary at exact DisputeDeadlineHeight.",
    "audit",
    15,
  );
  r.claimBounty({ caller: builder.address }, id2, "Claiming");
  r.submitProof({ caller: builder.address }, id2, "https://github.com/org/repo/pull/4", "sha256:dddddddd", "Delivered audit.");
  r.openDispute({ caller: builder.address }, id2, "Opening dispute.");
  const ddl = r.bounties.get(id2)!.disputeDeadlineHeight;
  r.advanceBlocks(ddl - r.chainHeight - 1);
  assert.throws(() => r.expireDispute({ caller: agent.address }, id2), /dispute resolution window has not expired/);
  r.advanceBlocks(1);
  r.expireDispute({ caller: agent.address }, id2);
  assert.equal(r.bounties.get(id2)?.payoutUgnot, 400_000);
  assert.equal(r.bounties.get(id2)?.refundUgnot, 400_000);
  assert.equal(r.assertEscrowInvariant(), true);
});

test("Cross-bounty SponsoredUgnot isolation and voluntary claimant step-down preserve donor shares", () => {
  const [sponsor, agent, donor, arbiter] = DEMO_ACTORS;
  const r = new HearthBountyRealm(arbiter.address, 500);
  r.seedBalances();

  const id1 = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
    "Isolation Quest #1",
    "First bounty to cancel without wiping second bounty credit.",
    "tool",
    30,
  );
  const id2 = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 2_000_000 }] },
    "Isolation Quest #2",
    "Second bounty to remain funded.",
    "realm",
    30,
  );
  r.topUpBounty({ caller: donor.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] }, id1);
  r.topUpBounty({ caller: donor.address, sentCoins: [{ denom: DENOM, amount: 700_000 }] }, id2);

  // Agent claims id2 and voluntarily steps down early -> donor shares remain intact.
  r.claimBounty({ caller: agent.address }, id2, "Claiming #2");
  r.releaseExpiredClaim({ caller: agent.address }, id2);
  assert.equal(r.profiles.get(agent.address)?.claimedCount, 0);
  assert.equal(r.getDonorContribution(id2, donor.address), 700_000);

  // Cancel id1 -> sponsor keeps 2.00 GNOT credit, donor keeps 0.70 GNOT credit.
  r.cancelBounty({ caller: sponsor.address }, id1);
  assert.equal(r.profiles.get(sponsor.address)?.sponsoredUgnot, 2_000_000);
  assert.equal(r.profiles.get(donor.address)?.sponsoredUgnot, 700_000);
  assert.equal(r.assertEscrowInvariant(), true);
});

test("Validation helpers and multi-Unicode sanitizer neutralize XSS and gno-tag variants", () => {
  assert.equal(validateDeadlineBlocks(0), 50_000);
  assert.throws(() => validateDeadlineBlocks(9), /out of allowed range/);
  assert.throws(() => validateDeadlineBlocks(2_000_001), /out of allowed range/);
  assert.equal(validateRating(1), 1);
  assert.equal(validateRating(5), 5);
  assert.throws(() => validateRating(0), /between 1 and 5/);
  assert.throws(() => validateRating(6), /between 1 and 5/);
  assert.throws(() => validateProofURL("javascript:alert(1)"), /must start with https:\/\//);
  assert.throws(() => validateProofURL("https://example.com/a b"), /must not contain whitespace/);

  const payloads = [
    `İİİ<gno-form exec="Drain"></gno-form>`,
    `ßİ<GNO-BUTTON href="/r/evil" />`,
    `<gNo-CoLuMnS>x</gNo-CoLuMnS>`,
    `<script>alert(1)</script> $$1+1$$`,
  ];
  for (const p of payloads) {
    const clean = sanitizeRenderText(p);
    assert.equal(clean.toLowerCase().includes("<gno-"), false);
    assert.equal(clean.toLowerCase().includes("</gno-"), false);
    assert.equal(clean.toLowerCase().includes("<script"), false);
  }
  assert.equal(neutralizeGnoTags("clean plain text"), "clean plain text");
});

test("renderMarkdown serves all routes cleanly and neutralizes injected bounty content", () => {
  const realm = createSeededRealm();
  const [sponsor] = DEMO_ACTORS;
  const evilId = realm.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 250_000 }] },
    `İ<gno-button href="/r/evil"/> Safe Title`,
    `İ<gno-form exec="Drain">Spec $100</gno-form>`,
    "audit",
    50,
  );

  const home = realm.renderMarkdown("");
  assert.match(home, /# HearthBounty v1/);
  assert.equal(home.includes("<gno-button"), false);

  const detail = realm.renderMarkdown(`bounty/${evilId}`);
  assert.equal(detail.includes("<gno-form"), false);
  assert.equal(detail.includes("\\$100"), true);

  assert.match(realm.renderMarkdown("bounty/999"), /Route Not Found/);
  assert.match(realm.renderMarkdown("leaderboard"), /Guild Reputation Leaderboard/);
  assert.match(realm.renderMarkdown("agents"), /AI Agent & MCP Hub/);
  assert.match(realm.renderMarkdown("unknown/route"), /Route Not Found/);
});

test("Onyx RPC client verifies live multi-realm snapshot, queryLiveRender, and offline fallback", async () => {
  const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
  const mockFetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/status")) {
      return new Response(
        JSON.stringify({
          result: {
            node_info: { network: "onyx-1", moniker: "rpc-mock" },
            sync_info: { latest_block_height: "1435000", latest_block_time: "2026-11-27T00:00:00Z", catching_up: false },
          },
        }),
      );
    }
    if (url.includes("/tx?hash=")) {
      const match = ONYX_ARTIFACTS.find((a) => url.includes(encodeURIComponent(a.txHashHex)));
      return new Response(
        JSON.stringify({
          result: {
            hash: match?.txHashHex ?? "0x0",
            height: String(match?.expectedBlockHeight ?? 1),
            tx_result: { GasUsed: String(match?.expectedGasUsed ?? 1), GasWanted: "200000000", ResponseBase: {} },
          },
        }),
      );
    }
    const parsed = new URL(url);
    const dataHex = (parsed.searchParams.get("data") ?? "").replace(/^0x/, "");
    const decoded = dataHex ? Buffer.from(dataHex, "hex").toString("utf8") : "";
    if (url.includes("qpkgmeta_json")) {
      return new Response(
        JSON.stringify({
          result: { response: { ResponseBase: { Data: b64(JSON.stringify({ path: decoded, status: "live" })) } } },
        }),
      );
    }
    if (url.includes("qeval") && decoded.includes("ExportStatsJSON")) {
      return new Response(
        JSON.stringify({
          result: { response: { ResponseBase: { Data: b64(`(${JSON.stringify(JSON.stringify({ total_bounties: 3 }))} string)`) } } },
        }),
      );
    }
    if (url.includes("qeval") && decoded.includes("ExportBountiesJSON")) {
      return new Response(
        JSON.stringify({
          result: { response: { ResponseBase: { Data: b64(`(${JSON.stringify(JSON.stringify({ count: 3, bounties: [] }))} string)`) } } },
        }),
      );
    }
    if (url.includes("qrender")) {
      return new Response(
        JSON.stringify({
          result: { response: { ResponseBase: { Data: b64("# Live Render Preview\n\nVerified on Onyx.") } } },
        }),
      );
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;

  const snap = await fetchLiveOnyxSnapshot("https://mock.onyx.local", mockFetch);
  assert.equal(snap.online, true);
  assert.equal(snap.node?.latestBlockHeight, 1_435_000);
  assert.equal(snap.metas.core.status, "live");
  assert.equal(snap.metas.v1.status, "live");
  assert.equal(snap.metas.guild.status, "live");
  assert.equal(snap.txs.v1.verified, true);
  assert.equal(Number(snap.liveV1Stats?.total_bounties), 3);
  assert.match(snap.liveGuildRenderPreview ?? "", /Live Render Preview/);

  const rendered = await queryLiveRender("gno.land/r/test/hearthbounty/v1", "/bounty/1", "https://mock.onyx.local", mockFetch);
  assert.equal(rendered.subPath, "bounty/1");
  assert.match(rendered.markdown, /Live Render Preview/);

  const offlineFetch = (async () => {
    throw new Error("ECONNREFUSED");
  }) as typeof fetch;
  const offlineSnap = await fetchLiveOnyxSnapshot("https://mock.onyx.local", offlineFetch);
  assert.equal(offlineSnap.online, false);
  assert.match(offlineSnap.error ?? "", /ECONNREFUSED/);
});

test("MCP browser emulator rejects invalid inputs, wrong statuses, and unknown chains across all 12 tools", async () => {
  const realm = createSeededRealm();
  assert.throws(() => assertWritableChain("custom-chain"), /Safety block/);

  const badId = await executeMcpTool(realm, "hearth_get_bounty", { id: 0 }, "onyx-1");
  assert.equal(badId.ok, false);

  const emptyProfile = await executeMcpTool(realm, "hearth_get_profile", { address: "   " }, "onyx-1");
  assert.equal(emptyProfile.ok, false);

  const badClaimStatus = await executeMcpTool(realm, "hearth_prepare_claim", { id: 1, agentNote: "Claim settled" }, "onyx-1");
  assert.equal(badClaimStatus.ok, false);
  assert.match(badClaimStatus.error ?? "", /not "open"/);

  const badSettleRating = await executeMcpTool(realm, "hearth_prepare_settle", { id: 2, rating: 6, reviewNote: "Bad" }, "onyx-1");
  assert.equal(badSettleRating.ok, false);

  const badExpireDispute = await executeMcpTool(realm, "hearth_prepare_expire_dispute", { id: 2 }, "onyx-1");
  assert.equal(badExpireDispute.ok, false);
  assert.match(badExpireDispute.error ?? "", /expected "disputed"/);

  const goodExpireSub = await executeMcpTool(realm, "hearth_prepare_expire_submission", { id: 2 }, "onyx-1");
  assert.equal(goodExpireSub.ok, true);

  const lbRes = await executeMcpTool(realm, "hearth_leaderboard", { limit: 5 }, "onyx-1");
  assert.equal(lbRes.ok, true);

  const renderRes = await executeMcpTool(realm, "hearth_render_page", { subPath: "agents" }, "onyx-1");
  assert.equal(renderRes.ok, true);
  assert.match((renderRes.response as { markdown: string }).markdown, /AI Agent & MCP Hub/);
});

test("Engine leaderboard sorts deterministically and AgentCount tracks profile toggles", () => {
  const [sponsor, agent, builder, arbiter] = DEMO_ACTORS;
  const r = new HearthBountyRealm(arbiter.address, 100);
  r.seedBalances();

  r.registerProfile({ caller: agent.address }, "bot-1", "bio", "gno", "");
  assert.equal(r.agentCount, 0);
  r.registerProfile({ caller: agent.address }, "bot-1", "bio", "gno", "mcp://bot1");
  assert.equal(r.agentCount, 1);
  r.registerProfile({ caller: agent.address }, "bot-1", "bio", "gno", "");
  assert.equal(r.agentCount, 0);

  r.postBounty({ caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 2_000_000 }] }, "Sort Quest A", "First bounty for tie-breaking.", "tool", 50);
  r.postBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] }, "Sort Quest B", "Second bounty for tie-breaking.", "docs", 50);
  const ranked = r.getRankedProfiles();
  assert.equal(ranked[0].address, sponsor.address);
  assert.equal(ranked[1].address, builder.address);
});
