/**
 * Built-in /diag Self-Test Runner (V2.1).
 * Verifies every HearthBounty v1 security invariant:
 *   - Integer conservation math & tier thresholds
 *   - Full CEI escrow lifecycle
 *   - H-1 per-contributor top-up refund custody & claimant wash block
 *   - M-1 review timeout auto-settlement, arbiter conflict guard, and 50/50 dispute fallback
 *   - M-2 Unicode U+0130 ('İ') tag neutralization & HTTPS-only proof links
 *   - Interrealm v2 AssertOriginCall & wrong-denom / dust guards
 *   - Exact deadline block claim release + ClaimedCount decrement
 *   - MCP 12-tool catalog & gnoland-1 mainnet write block
 *   - Live Gno.land Onyx (onyx-1) RPC proofs for hearthcore/v0, hearthbounty/v1, and hearthguild/v0
 */

import {
  computeSha256Digest,
  computeSplit,
  computeTier,
  DEMO_ACTORS,
  DENOM,
  HearthBountyRealm,
  legacyVulnerableNeutralizeGnoTagsV0,
  neutralizeGnoTags,
  sanitizeRenderText,
  validateProofURL,
} from "./engine.js";
import { assertWritableChain, executeMcpTool, MCP_TOOLS } from "./mcp.js";
import { fetchLiveOnyxSnapshot, ONYX_ARTIFACTS } from "./onyx.js";

export interface DiagCheckResult {
  id: string;
  name: string;
  category: "core" | "escrow" | "security" | "mcp" | "onyx";
  passed: boolean;
  durationMs: number;
  detail: string;
}

export interface DiagReport {
  ranAt: string;
  total: number;
  passed: number;
  failed: number;
  totalDurationMs: number;
  checks: DiagCheckResult[];
}

async function runCheck(
  id: string,
  name: string,
  category: DiagCheckResult["category"],
  fn: () => Promise<string> | string,
): Promise<DiagCheckResult> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { id, name, category, passed: true, durationMs: Date.now() - start, detail };
  } catch (err) {
    return {
      id,
      name,
      category,
      passed: false,
      durationMs: Date.now() - start,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

function assertEq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertThrows(fn: () => void, needle: string, label: string): void {
  let caught = "";
  try {
    fn();
  } catch (err) {
    caught = err instanceof Error ? err.message : String(err);
  }
  if (!caught.includes(needle)) {
    throw new Error(`${label}: expected error containing "${needle}", got "${caught || "no error"}"`);
  }
}

export async function runDiagnostics(options?: { skipLiveOnyx?: boolean }): Promise<DiagReport> {
  const startAll = Date.now();
  const [sponsor, agent, builder, arbiter] = DEMO_ACTORS;

  const checks: DiagCheckResult[] = [];

  checks.push(
    await runCheck(
      "diag-split",
      "ComputeSplit Exact Integer Conservation",
      "core",
      () => {
        const vectors: Array<[number, number, number, number]> = [
          [1_000_000, 0, 0, 1_000_000],
          [1_000_000, 10_000, 1_000_000, 0],
          [999_999, 3_333, 333_299, 666_700],
          [1, 5_000, 0, 1],
          [9_000_000_000_000_000, 3_333, 2_999_700_000_000_000, 6_000_300_000_000_000],
        ];
        for (const [escrow, bps, wantH, wantS] of vectors) {
          const { hunterUgnot, sponsorRefundUgnot } = computeSplit(escrow, bps);
          assertEq(hunterUgnot, wantH, `hunter(${escrow},${bps})`);
          assertEq(sponsorRefundUgnot, wantS, `sponsor(${escrow},${bps})`);
          assertEq(hunterUgnot + sponsorRefundUgnot, escrow, "conservation");
        }
        return "All 5 edge vectors (up to 9e15 wugnot) satisfied hunter + refund == escrow.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-tier",
      "Deterministic Reputation Tier Thresholds",
      "core",
      () => {
        assertEq(computeTier(0, 0, 0, 0), "Apprentice", "0 settled");
        assertEq(computeTier(2, 5_000_000, 9, 2), "Journeyman", "2 settled");
        assertEq(computeTier(5, 10_000_000, 23, 5), "Master", "5 settled");
        assertEq(computeTier(10, 50_000_000, 48, 10), "Guildmaster", "10 settled high rating");
        assertEq(computeTier(10, 50_000_000, 30, 10), "Master", "low rating blocks Guildmaster");
        return "Apprentice, Journeyman, Master, Guildmaster, and 4.5+ quality gate verified.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-lifecycle",
      "Full 1:1 wugnot Escrow Lifecycle & CEI Conservation",
      "escrow",
      async () => {
        const r = new HearthBountyRealm(arbiter.address, 100);
        r.seedBalances();
        const id = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 2_000_000 }] },
          "Diag Lifecycle Quest",
          "Verify post, top-up, claim, proof, revision, resubmit, and CEI settle.",
          "realm",
          200,
        );
        r.topUpBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] }, id);
        assertEq(r.assertEscrowInvariant(), true, "invariant post-topup");
        r.claimBounty({ caller: agent.address }, id, "Claiming via /diag");
        const digest = await computeSha256Digest("abc");
        assertEq(
          digest,
          "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
          "NIST SHA-256 vector",
        );
        r.submitProof({ caller: agent.address }, id, "https://github.com/org/repo/pull/1", digest, "First proof submission.");
        r.requestRevision({ caller: sponsor.address }, id, "Add edge-case test.");
        r.submitProof({ caller: agent.address }, id, "https://github.com/org/repo/pull/1", digest, "Added edge-case tests.");
        const beforeBal = r.getBalance(agent.address);
        r.approveAndSettle({ caller: sponsor.address }, id, 5, "Verified.");
        assertEq(r.getBalance(agent.address), beforeBal + 2_500_000, "exact payout");
        assertEq(r.assertEscrowInvariant(), true, "invariant post-settle");
        assertEq(r.totalEscrowUgnot, 0, "escrow drained");
        assertEq(r.totalSettledUgnot, 2_500_000, "settled volume");
        return "2.50 GNOT settled atomically via CEI; realmEscrow == totalEscrowUgnot == 0.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-h1-custody",
      "H-1 Fix: Per-Contributor TopUp Custody & Claimant Wash Guard",
      "security",
      () => {
        const r = new HearthBountyRealm(arbiter.address, 100);
        r.seedBalances();
        const id = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] },
          "H-1 Donor Custody Check",
          "Verify sponsor cancel cannot steal third-party top-up coins.",
          "audit",
          100,
        );
        r.topUpBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 1_500_000 }] }, id);
        assertThrows(
          () => r.claimBounty({ caller: builder.address }, id, "donor wash"),
          "escrow contributor cannot claim own funded bounty",
          "donor claim block",
        );
        const spBefore = r.getBalance(sponsor.address);
        const donorBefore = r.getBalance(builder.address);
        r.cancelBounty({ caller: sponsor.address }, id);
        assertEq(r.getBalance(sponsor.address), spBefore + 500_000, "sponsor gets own 0.50 only");
        assertEq(r.getBalance(builder.address), donorBefore + 1_500_000, "donor recovers full 1.50");
        assertEq(r.profiles.get(sponsor.address)?.sponsoredUgnot ?? -1, 0, "sponsor phantom credit cleared");
        assertEq(r.profiles.get(builder.address)?.sponsoredUgnot ?? -1, 0, "donor phantom credit cleared");
        assertEq(r.assertEscrowInvariant(), true, "invariant post-cancel");

        const id2 = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] },
          "H-1 Claimant Wash Check",
          "Verify active claimant cannot top up own claimed bounty.",
          "tool",
          50,
        );
        r.claimBounty({ caller: agent.address }, id2, "Claiming");
        assertThrows(
          () => r.topUpBounty({ caller: agent.address, sentCoins: [{ denom: DENOM, amount: 200_000 }] }, id2),
          "active claimant cannot top up own claimed bounty",
          "claimant wash block",
        );
        return "Sponsor cancel returned 0.50 GNOT to sponsor and 1.50 GNOT directly to donor; wash vectors blocked.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-m1-timeouts",
      "M-1 Fix: Review Timeout, Arbiter Conflict Guard & 50/50 Dispute Fallback",
      "escrow",
      () => {
        const r = new HearthBountyRealm(arbiter.address, 100);
        r.seedBalances();
        // 1. Submission review timeout -> bystander settles 100% to claimant
        const id1 = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_200_000 }] },
          "M-1 Review Timeout",
          "Verify ExpireSubmission settles 100% after review deadline.",
          "realm",
          30,
        );
        r.claimBounty({ caller: agent.address }, id1, "Delivering");
        r.submitProof({ caller: agent.address }, id1, "https://github.com/org/repo/pull/7", "sha256:fedcba9876543210", "Delivered work.");
        assertThrows(
          () => r.expireSubmission({ caller: builder.address }, id1),
          "submission review window has not expired yet",
          "early expireSubmission block",
        );
        const agentBefore = r.getBalance(agent.address);
        r.advanceBlocks(30);
        r.expireSubmission({ caller: builder.address }, id1);
        assertEq(r.getBalance(agent.address), agentBefore + 1_200_000, "auto-settled 100%");

        // 2. Conflicted arbiter blocked + 50/50 fallback with pro-rata donor refund
        const id2 = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
          "M-1 Conflicted Arbiter",
          "Verify conflicted arbiter is blocked and ExpireDispute splits 50/50 pro-rata.",
          "audit",
          25,
        );
        r.topUpBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] }, id2);
        r.claimBounty({ caller: arbiter.address }, id2, "Arbiter acting as claimant");
        r.submitProof({ caller: arbiter.address }, id2, "https://github.com/org/repo/pull/9", "sha256:1234567890abcdef", "Submitted work.");
        r.openDispute({ caller: arbiter.address }, id2, "Testing conflict block.");
        assertThrows(
          () => r.resolveDispute({ caller: arbiter.address }, id2, 10_000, "self payout"),
          "arbiter cannot resolve a bounty they are party to",
          "conflicted arbiter block",
        );
        const arbBefore = r.getBalance(arbiter.address);
        const spBefore2 = r.getBalance(sponsor.address);
        const donorBefore2 = r.getBalance(builder.address);
        r.advanceBlocks(25);
        r.expireDispute({ caller: agent.address }, id2);
        assertEq(r.getBalance(arbiter.address), arbBefore + 750_000, "50% hunter payout");
        assertEq(r.getBalance(sponsor.address), spBefore2 + 500_000, "50% sponsor pro-rata refund");
        assertEq(r.getBalance(builder.address), donorBefore2 + 250_000, "50% donor pro-rata refund");
        assertEq(r.assertEscrowInvariant(), true, "invariant post-dispute-timeout");
        return "ExpireSubmission settled 1.20 GNOT; conflicted arbiter blocked; ExpireDispute split 0.75/0.50/0.25 GNOT.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-m2-unicode",
      "M-2 Fix: Unicode U+0130 ('İ') Tag Neutralization & HTTPS-Only URLs",
      "security",
      () => {
        const payload = `İ<gno-form exec="PostBounty">\n</gno-form> İ<GNO-BUTTON href="/r/evil" /> $GNOT/$ATOM`;
        const legacyOut = legacyVulnerableNeutralizeGnoTagsV0(payload);
        if (!legacyOut.includes("<gno-form")) {
          throw new Error("Expected legacy v0 control vector to exhibit U+0130 desync.");
        }
        const patched = sanitizeRenderText(payload);
        if (patched.includes("<gno-form") || patched.includes("</gno-form") || patched.includes("<GNO-BUTTON")) {
          throw new Error("Smuggled <gno-*> tag survived patched ASCII-folding NeutralizeGnoTags.");
        }
        if (!patched.includes("\\$GNOT/\\$ATOM")) {
          throw new Error("Unescaped dollar signs survived EscapeMath.");
        }
        assertEq(validateProofURL("https://github.com/org/repo/pull/1"), "https://github.com/org/repo/pull/1", "https allowed");
        assertThrows(
          () => validateProofURL("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"),
          "must start with https://",
          "ipfs rejected",
        );
        assertThrows(
          () => validateProofURL("http://insecure.example.com/proof"),
          "must start with https://",
          "http rejected",
        );
        assertEq(neutralizeGnoTags("<GNO-FORM>").startsWith("&lt;"), true, "case-fold escape");
        return "U+0130 'İ<gno-form>' 100% neutralized (v0 leaked, v1 blocked); ipfs:// and http:// rejected.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-guards",
      "Interrealm v2 Direct-EOA, Single-Token & Dust Guards",
      "security",
      () => {
        const r = new HearthBountyRealm(arbiter.address, 100);
        r.seedBalances();
        assertThrows(
          () =>
            r.postBounty(
              { caller: sponsor.address, isOriginCall: false, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
              "Cross-Realm Attack",
              "Attempt to bypass AssertOriginCall from a wrapper realm.",
              "audit",
              100,
            ),
          "invalid non-origin call",
          "AssertOriginCall",
        );
        assertThrows(
          () =>
            r.postBounty(
              { caller: sponsor.address, sentCoins: [{ denom: "uatom", amount: 1_000_000 }] },
              "Wrong Denom",
              "Attempt to trap unsupported uatom coin in escrow.",
              "audit",
              100,
            ),
          "only 1:1 ugnot-backed wugnot escrow is accepted",
          "single-token guard",
        );
        assertThrows(
          () =>
            r.postBounty(
              { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 50_000 }] },
              "Dust Attack",
              "Attempt below 100000 wugnot floor.",
              "audit",
              100,
            ),
          "below minimum required",
          "dust guard",
        );
        return "AssertOriginCall, non-wugnot uatom rejection, and 0.10 GNOT floor enforced.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-expiry",
      "Exact-Block Claim Expiry, Proof Clearing & ClaimedCount Decrement",
      "escrow",
      () => {
        const r = new HearthBountyRealm(arbiter.address, 100);
        r.seedBalances();
        const id = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
          "Expiry Test Bounty",
          "Short 20-block claim window for exact deadline release test.",
          "docs",
          20,
        );
        r.claimBounty({ caller: builder.address }, id, "Working");
        r.submitProof({ caller: builder.address }, id, "https://github.com/org/repo/pull/2", "sha256:0123456789abcdef", "Draft submission.");
        r.requestRevision({ caller: sponsor.address }, id, "Needs revision.");
        assertThrows(
          () => r.releaseExpiredClaim({ caller: agent.address }, id),
          "claim deadline has not expired yet",
          "no early release",
        );
        r.advanceBlocks(20);
        r.releaseExpiredClaim({ caller: agent.address }, id);
        const b = r.bounties.get(id)!;
        assertEq(b.status, "open", "returned to open");
        assertEq(b.proofURL, "", "stale proofURL cleared");
        assertEq(r.profiles.get(builder.address)?.claimedCount ?? -1, 0, "claimedCount decremented");
        return "Released at exact DeadlineHeight (+20 blocks), cleared stale proof fields, decremented claimedCount.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-mcp",
      "MCP 12-Tool Emulator & Mainnet Write-Safety Block",
      "mcp",
      async () => {
        assertEq(MCP_TOOLS.length, 12, "12 MCP tools registered");
        assertThrows(() => assertWritableChain("gnoland-1"), "Safety block", "gnoland-1 block");
        assertThrows(() => assertWritableChain("mainnet"), "Safety block", "mainnet block");
        const r = new HearthBountyRealm(arbiter.address, 100);
        r.seedBalances();
        const blocked = await executeMcpTool(
          r,
          "hearth_prepare_post_bounty",
          {
            title: "Mainnet Block Check",
            spec: "Ensure write preparation refuses gnoland-1 mainnet.",
            category: "agent",
            rewardUgnot: 500_000,
          },
          "gnoland-1",
        );
        assertEq(blocked.ok, false, "mainnet write prep must fail");
        const allowed = await executeMcpTool(
          r,
          "hearth_prepare_post_bounty",
          {
            title: "Onyx Write Check",
            spec: "Ensure write preparation succeeds on onyx-1 testnet.",
            category: "agent",
            rewardUgnot: 500_000,
          },
          "onyx-1",
        );
        assertEq(allowed.ok, true, "onyx-1 write prep must succeed");
        const statusRes = await executeMcpTool(r, "hearth_chain_status", {}, "onyx-1");
        assertEq((statusRes.response as { packageStatus: string }).packageStatus, "in-browser-emulator", "honest emulator status");
        return "12 MCP tools verified; gnoland-1 writes blocked; onyx-1 wugnot pre-steps + PostBounty built.";
      },
    ),
  );

  if (!options?.skipLiveOnyx) {
    checks.push(
      await runCheck(
        "diag-onyx-rpc",
        "Live Gno.land Onyx (onyx-1) RPC & Multi-Realm Proof Verification",
        "onyx",
        async () => {
          const snap = await fetchLiveOnyxSnapshot();
          if (!snap.online || !snap.node) {
            throw new Error(`Onyx RPC unreachable: ${snap.error ?? "network error"}`);
          }
          assertEq(snap.node.network, "onyx-1", "network chain_id");
          assertEq(snap.metas.core?.status, "live", "hearthcore/v0 live status");
          assertEq(snap.metas.v1?.status, "live", "hearthbounty/v1 live status");
          for (const art of ONYX_ARTIFACTS.filter((a) => !a.legacy)) {
            const tx = snap.txs[art.id];
            if (!tx?.verified || tx.height !== art.expectedBlockHeight) {
              throw new Error(`${art.label} TX proof mismatch (got block ${tx?.height ?? "none"})`);
            }
          }
          const totalBounties = Number(snap.liveV1Stats?.total_bounties ?? 0);
          if (totalBounties < 3) {
            throw new Error(`Expected >=3 live seeded bounties on hearthbounty/v1, got ${totalBounties}`);
          }
          return `onyx-1 live at #${snap.node.latestBlockHeight.toLocaleString()} (${snap.latencyMs}ms); hearthcore/v0=live @ #1,374,766; hearthbounty/v1=live @ #1,378,958 (${totalBounties} seeded bounties); hearthguild/v0=${snap.metas.guild?.status ?? "?"} @ #1,378,960.`;
        },
      ),
    );
  }

  const passed = checks.filter((c) => c.passed).length;
  return {
    ranAt: new Date().toISOString(),
    total: checks.length,
    passed,
    failed: checks.length - passed,
    totalDurationMs: Date.now() - startAll,
    checks,
  };
}
