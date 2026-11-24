import assert from "node:assert/strict";
import test from "node:test";
import { BREAKER_TESTS, runBreakerTest } from "../src/breaker.js";
import {
  computeSha256Digest,
  computeSplit,
  computeTier,
  createSeededRealm,
  DEMO_ACTORS,
  formatGNOT,
  legacyVulnerableNeutralizeGnoTagsV0,
  sanitizeRenderText,
} from "../src/engine.js";
import { runDiagnostics } from "../src/diag.js";
import { assertWritableChain, executeMcpTool, MCP_TOOLS } from "../src/mcp.js";
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
