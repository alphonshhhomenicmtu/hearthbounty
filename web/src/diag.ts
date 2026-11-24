/**
 * Built-in /diag Self-Test Runner.
 * Verifies every critical HearthBounty invariant (math, state machine, CEI
 * conservation, Interrealm v2 guards, Render sanitizer, MCP mainnet safety,
 * and live Gno.land Onyx RPC proof verification).
 */

import {
  computeSha256Digest,
  computeSplit,
  computeTier,
  DEMO_ACTORS,
  DENOM,
  HearthBountyRealm,
  sanitizeRenderText,
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
        return "All 5 edge vectors (up to 9e15 ugnot) satisfied hunter + sponsor == escrow.";
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
      "Full Escrow Lifecycle & CEI Bank Balance Invariant",
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
        return "2.50 GNOT settled atomically via CEI; realm bank == totalEscrowUgnot == 0.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-guards",
      "Interrealm v2 Payment & Auth Guards",
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
          "only ugnot coins are accepted",
          "single-denom guard",
        );
        const id = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
          "Self Claim Test",
          "Verify sponsor cannot claim their own bounty.",
          "tool",
          100,
        );
        assertThrows(
          () => r.claimBounty({ caller: sponsor.address }, id, "self"),
          "sponsor cannot claim own bounty",
          "self-claim guard",
        );
        return "AssertOriginCall, uatom rejection, and sponsor self-claim block enforced.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-expiry",
      "Block-Height Claim Expiry & Sponsor Cancel Refund",
      "escrow",
      () => {
        const r = new HearthBountyRealm(arbiter.address, 100);
        r.seedBalances();
        const id = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
          "Expiry Test Bounty",
          "Short 20-block claim window for expiry test.",
          "docs",
          20,
        );
        r.claimBounty({ caller: builder.address }, id, "Working");
        assertThrows(
          () => r.cancelBounty({ caller: sponsor.address }, id),
          "only open bounties can be cancelled",
          "no cancel while claimed",
        );
        assertThrows(
          () => r.releaseExpiredClaim({ caller: agent.address }, id),
          "claim deadline has not expired yet",
          "no early release",
        );
        r.advanceBlocks(25);
        r.releaseExpiredClaim({ caller: agent.address }, id);
        const beforeRefund = r.getBalance(sponsor.address);
        r.cancelBounty({ caller: sponsor.address }, id);
        assertEq(r.getBalance(sponsor.address), beforeRefund + 1_000_000, "full refund");
        assertEq(r.assertEscrowInvariant(), true, "invariant post-cancel");
        return "Bystander released stale claim at +25 blocks; sponsor recovered 1.00 GNOT.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-dispute",
      "Arbiter 70/30 Basis-Point Dispute Split",
      "escrow",
      () => {
        const r = new HearthBountyRealm(arbiter.address, 100);
        r.seedBalances();
        const id = r.postBounty(
          { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
          "Dispute Split Test",
          "Verify atomic 7000 bps hunter / 3000 bps sponsor split.",
          "audit",
          100,
        );
        r.claimBounty({ caller: builder.address }, id, "Auditing");
        r.submitProof(
          { caller: builder.address },
          id,
          "https://github.com/hearthbounty/audit/blob/main/report.md",
          "sha256:abcdef0123456789",
          "Delivered 70% of scope.",
        );
        r.openDispute({ caller: builder.address }, id, "Requesting 70/30 partial settlement.");
        assertThrows(
          () => r.resolveDispute({ caller: sponsor.address }, id, 7000, "unauthorized"),
          "only the arbiter may resolve disputes",
          "arbiter auth",
        );
        const hBefore = r.getBalance(builder.address);
        const sBefore = r.getBalance(sponsor.address);
        r.resolveDispute({ caller: arbiter.address }, id, 7000, "70% scope verified.");
        assertEq(r.getBalance(builder.address), hBefore + 700_000, "hunter 70%");
        assertEq(r.getBalance(sponsor.address), sBefore + 300_000, "sponsor 30%");
        assertEq(r.assertEscrowInvariant(), true, "invariant post-dispute");
        return "Arbiter resolved 7000 bps -> 0.70 GNOT hunter + 0.30 GNOT sponsor refund.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-sanitize",
      "Render() Markdown, Math & <gno-*> Tag Neutralization",
      "security",
      () => {
        const malicious = `Test <gno-button href="/r/evil" label="Steal" /> and <gno-form exec="Drain"> $GNOT/$ATOM`;
        const clean = sanitizeRenderText(malicious);
        if (clean.includes("<gno-button") || clean.includes("<gno-form")) {
          throw new Error("Smuggled <gno-*> directive survived sanitization.");
        }
        if (!clean.includes("\\$GNOT/\\$ATOM")) {
          throw new Error("Unescaped dollar signs survived EscapeMath.");
        }
        return "Injected <gno-button>, <gno-form>, and TeX $math neutralized cleanly.";
      },
    ),
  );

  checks.push(
    await runCheck(
      "diag-mcp",
      "MCP 10-Tool Catalog & Mainnet Write-Safety Block",
      "mcp",
      async () => {
        assertEq(MCP_TOOLS.length, 10, "10 MCP tools registered");
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
        return "10 MCP tools verified; gnoland-1 writes blocked; onyx-1 payload built.";
      },
    ),
  );

  if (!options?.skipLiveOnyx) {
    checks.push(
      await runCheck(
        "diag-onyx-rpc",
        "Live Gno.land Onyx (onyx-1) RPC & Block Proof Verification",
        "onyx",
        async () => {
          const snap = await fetchLiveOnyxSnapshot();
          if (!snap.online || !snap.node) {
            throw new Error(`Onyx RPC unreachable: ${snap.error ?? "network error"}`);
          }
          assertEq(snap.node.network, "onyx-1", "network chain_id");
          if (!snap.coreTx?.verified || snap.coreTx.height !== ONYX_ARTIFACTS[0].expectedBlockHeight) {
            throw new Error(`hearthcore/v0 TX proof mismatch (got block ${snap.coreTx?.height ?? "none"})`);
          }
          if (!snap.realmTx?.verified || snap.realmTx.height !== ONYX_ARTIFACTS[1].expectedBlockHeight) {
            throw new Error(`hearthbounty/v0 TX proof mismatch (got block ${snap.realmTx?.height ?? "none"})`);
          }
          return `onyx-1 live at block #${snap.node.latestBlockHeight.toLocaleString()} (${snap.latencyMs}ms); hearthcore/v0=${snap.coreMeta?.status ?? "?"} @ #1,374,766; hearthbounty/v0=${snap.realmMeta?.status ?? "?"} @ #1,374,813.`;
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
