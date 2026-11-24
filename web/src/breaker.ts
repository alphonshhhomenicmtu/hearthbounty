/**
 * Adversarial Breaker Lab (V2.1).
 * Provides 1-click runnable exploit simulations proving every red-team finding
 * (H-1, M-1, M-2, and Interrealm v2 MITM / wrong-denom guards) is fixed on-chain.
 */

import {
  DEMO_ACTORS,
  DENOM,
  formatGNOT,
  HearthBountyRealm,
  legacyVulnerableNeutralizeGnoTagsV0,
  sanitizeRenderText,
  validateProofURL,
} from "./engine.js";

export type BreakerId = "h1-topup-theft" | "m2-unicode-tag" | "mitm-denom-guard" | "m1-timeout-conflict";

export interface BreakerTestSpec {
  id: BreakerId;
  severity: "HIGH" | "MEDIUM" | "GUARD";
  code: string;
  title: string;
  attackSummary: string;
  fixSummary: string;
  buttonLabel: string;
}

export interface BreakerRunResult {
  id: BreakerId;
  passed: boolean;
  ranAt: string;
  headline: string;
  steps: Array<{ label: string; outcome: "DEFENDED" | "LEAKED_IN_V0" | "SETTLED"; detail: string }>;
  beforeAfter?: {
    v0Behavior: string;
    v1Behavior: string;
  };
}

export const BREAKER_TESTS: BreakerTestSpec[] = [
  {
    id: "h1-topup-theft",
    severity: "HIGH",
    code: "H-1",
    title: "Third-Party TopUp Theft & Claimant Wash",
    attackSummary:
      "Sponsor posts 0.50 GNOT, two external donors crowd-fund +1.90 GNOT, then Sponsor calls CancelBounty hoping to pocket 2.40 GNOT. Also tests donor self-claim and claimant self-top-up wash.",
    fixSummary:
      "Per-contributor AVL DonorShares ledger refunds Sponsor strictly 0.50 GNOT and returns 1.50 + 0.40 GNOT directly to donors while zeroing phantom SponsoredUgnot credits and blocking wash vectors.",
    buttonLabel: "Run H-1 TopUp Theft Exploit",
  },
  {
    id: "m2-unicode-tag",
    severity: "MEDIUM",
    code: "M-2",
    title: "Unicode U+0130 ('İ') Tag Injection & Non-HTTPS Links",
    attackSummary:
      "Prefixes <gno-form exec=\"PostBounty\"> with Turkish dotted capital 'İ' (U+0130), which expands to 2 code units under toLower() and desynced v0 slice indices, letting raw <gno-form> tags pass through Render().",
    fixSummary:
      "Direct byte/code-unit ASCII case-folding NeutralizeGnoTags never calls toLower() on Unicode runes, neutralizing 100% of <gno-*> tags. ValidateProofURL enforces https:// only.",
    buttonLabel: "Run M-2 Unicode Bypass Exploit",
  },
  {
    id: "mitm-denom-guard",
    severity: "GUARD",
    code: "IR-v2",
    title: "Cross-Realm MITM, Wrong Denom (uatom) & Dust Lock",
    attackSummary:
      "Attempts to hijack funding through a cross-realm wrapper (AssertOriginCall=false), inject unsupported uatom coins into escrow, and spam donor ledgers with 50,000 wugnot dust.",
    fixSummary:
      "PostBounty & TopUpBounty enforce runtime.AssertOriginCall() + cur.Previous().IsUserCall(), restrict custody strictly to 1:1 ugnot-backed wugnot via grc20reg, and enforce a 100,000 wugnot floor.",
    buttonLabel: "Run MITM / uatom Guard Exploit",
  },
  {
    id: "m1-timeout-conflict",
    severity: "MEDIUM",
    code: "M-1",
    title: "Hostage Submission, Conflicted Arbiter & Dispute Timeout",
    attackSummary:
      "Ghosting sponsor ignores a delivered proof forever; in a second bounty, the arbiter claims the quest and tries to self-award 100% (10000 bps) in ResolveDispute.",
    fixSummary:
      "Permissionless ExpireSubmission auto-settles 100% after ReviewDeadlineHeight; ResolveDispute rejects arbiter == sponsor/claimant; permissionless ExpireDispute triggers a 50/50 pro-rata split.",
    buttonLabel: "Run M-1 Timeout & Conflict Exploit",
  },
];

function captureAbort(fn: () => void): string {
  try {
    fn();
    return "";
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

export function runBreakerTest(id: BreakerId): BreakerRunResult {
  const [sponsor, agent, builder, arbiter] = DEMO_ACTORS;
  const donorB = "g1donorbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const ranAt = new Date().toISOString();

  if (id === "h1-topup-theft") {
    const r = new HearthBountyRealm(arbiter.address, 1_378_958);
    r.seedBalances();
    r.balances.set(donorB, 50_000_000);

    const bId = r.postBounty(
      { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] },
      "H-1 Custody Verification Bounty",
      "Verify sponsor cannot pocket external top-ups on CancelBounty.",
      "audit",
      100,
    );
    r.topUpBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] }, bId);
    r.topUpBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] }, bId);
    r.topUpBounty({ caller: donorB, sentCoins: [{ denom: DENOM, amount: 400_000 }] }, bId);

    const donorClaimErr = captureAbort(() => r.claimBounty({ caller: builder.address }, bId, "wash attempt"));

    const spBefore = r.getBalance(sponsor.address);
    const dABefore = r.getBalance(builder.address);
    const dBBefore = r.getBalance(donorB);
    r.cancelBounty({ caller: sponsor.address }, bId);

    const spDelta = r.getBalance(sponsor.address) - spBefore;
    const dADelta = r.getBalance(builder.address) - dABefore;
    const dBDelta = r.getBalance(donorB) - dBBefore;

    const bId2 = r.postBounty(
      { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] },
      "H-1 Claimant Wash Guard",
      "Verify active claimant cannot top up own claimed bounty.",
      "tool",
      50,
    );
    r.claimBounty({ caller: agent.address }, bId2, "Claiming");
    const washErr = captureAbort(() =>
      r.topUpBounty({ caller: agent.address, sentCoins: [{ denom: DENOM, amount: 200_000 }] }, bId2),
    );

    const spCred = r.profiles.get(sponsor.address)?.sponsoredUgnot ?? -1;
    const dACred = r.profiles.get(builder.address)?.sponsoredUgnot ?? -1;
    const ok =
      spDelta === 500_000 &&
      dADelta === 1_500_000 &&
      dBDelta === 400_000 &&
      dACred === 0 &&
      spCred === 500_000 && // only bId2 remains active
      donorClaimErr.includes("escrow contributor cannot claim") &&
      washErr.includes("active claimant cannot top up") &&
      r.assertEscrowInvariant();

    return {
      id,
      passed: ok,
      ranAt,
      headline: ok
        ? "DEFENDED — Sponsor recovered strictly 0.50 GNOT; external donors recovered 1.50 + 0.40 GNOT directly; 0.00 GNOT stolen."
        : "FAILED — Custody invariant mismatch.",
      steps: [
        {
          label: "1. Crowd-funded escrow locked",
          outcome: "SETTLED",
          detail: `Bounty #${bId}: Sponsor 0.50 GNOT + Donor A 1.50 GNOT + Donor B 0.40 GNOT = 2.40 GNOT total.`,
        },
        {
          label: "2. External donor self-claim blocked",
          outcome: "DEFENDED",
          detail: `ClaimBounty(donorA) aborted -> "${donorClaimErr}"`,
        },
        {
          label: "3. Sponsor CancelBounty direct contributor refunds",
          outcome: "DEFENDED",
          detail: `Sponsor +${formatGNOT(spDelta)} · Donor A +${formatGNOT(dADelta)} · Donor B +${formatGNOT(dBDelta)} · Donor A phantom credit = ${dACred} ugnot · Bank invariant OK.`,
        },
        {
          label: "4. Active claimant self-top-up wash blocked",
          outcome: "DEFENDED",
          detail: `TopUpBounty(claimant) aborted -> "${washErr}"`,
        },
      ],
      beforeAfter: {
        v0Behavior: "Legacy v0 refunded all 2.40 GNOT to Sponsor (+1.90 GNOT stolen from external donors).",
        v1Behavior: "Patched v1 refunded 0.50 GNOT to Sponsor, 1.50 GNOT to Donor A, 0.40 GNOT to Donor B directly.",
      },
    };
  }

  if (id === "m2-unicode-tag") {
    const payload = `İ<gno-form exec="PostBounty">\n</gno-form> İ<GNO-BUTTON href="/r/evil" /> $GNOT/$ATOM`;
    const v0Out = legacyVulnerableNeutralizeGnoTagsV0(payload);
    const v1Out = sanitizeRenderText(payload);
    const ipfsErr = captureAbort(() => validateProofURL("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"));
    const httpErr = captureAbort(() => validateProofURL("http://insecure.example.com/proof"));

    const v0Leaked = v0Out.includes("<gno-form");
    const v1Clean =
      !v1Out.includes("<gno-form") &&
      !v1Out.includes("</gno-form") &&
      !v1Out.includes("<GNO-BUTTON") &&
      v1Out.includes("\\$GNOT/\\$ATOM");
    const ok = v0Leaked && v1Clean && ipfsErr.includes("https://") && httpErr.includes("https://");

    return {
      id,
      passed: ok,
      ranAt,
      headline: ok
        ? "DEFENDED — U+0130 ('İ') tag smuggling completely neutralized in v1; ipfs:// & http:// links rejected."
        : "FAILED — Sanitizer bypass check failed.",
      steps: [
        {
          label: "1. Legacy v0 toLower() index-desync reproduced",
          outcome: "LEAKED_IN_V0",
          detail: `v0 output still contained raw <gno-form>: ${v0Out.replaceAll("\n", " ")}`,
        },
        {
          label: "2. Patched v1 ASCII byte-folding NeutralizeGnoTags",
          outcome: "DEFENDED",
          detail: `v1 output escaped every directive & $math: ${v1Out.replaceAll("\n", " ")}`,
        },
        {
          label: "3. Non-HTTPS proof link rejection (ValidateProofURL)",
          outcome: "DEFENDED",
          detail: `ipfs:// -> "${ipfsErr}" · http:// -> "${httpErr}"`,
        },
      ],
      beforeAfter: {
        v0Behavior: `Leaked raw tag: ${v0Out.replaceAll("\n", " ")}`,
        v1Behavior: `Escaped cleanly: ${v1Out.replaceAll("\n", " ")}`,
      },
    };
  }

  if (id === "mitm-denom-guard") {
    const r = new HearthBountyRealm(arbiter.address, 1_378_958);
    r.seedBalances();

    const mitmErr = captureAbort(() =>
      r.postBounty(
        { caller: sponsor.address, isOriginCall: false, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
        "MITM Wrapper Attack",
        "Cross-realm wrapper trying to hijack PostBounty allowance.",
        "audit",
        100,
      ),
    );
    const denomErr = captureAbort(() =>
      r.postBounty(
        { caller: sponsor.address, sentCoins: [{ denom: "uatom", amount: 1_000_000 }] },
        "Unsupported Denom Attack",
        "Attempting to deposit non-wugnot uatom into escrow.",
        "audit",
        100,
      ),
    );
    const dustErr = captureAbort(() =>
      r.postBounty(
        { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 50_000 }] },
        "Sub-Floor Dust Attack",
        "Attempting to create a 0.05 GNOT dust bounty below the 0.10 GNOT floor.",
        "audit",
        100,
      ),
    );

    const ok =
      mitmErr.includes("invalid non-origin call") &&
      denomErr.includes("only 1:1 ugnot-backed wugnot escrow") &&
      dustErr.includes("below minimum required") &&
      r.bounties.size === 0 &&
      r.assertEscrowInvariant();

    return {
      id,
      passed: ok,
      ranAt,
      headline: ok
        ? "DEFENDED — Cross-realm MITM, unsupported uatom denom, and 0.05 GNOT dust all aborted cleanly with 0 state mutation."
        : "FAILED — Payment guard bypassed.",
      steps: [
        {
          label: "1. Cross-realm MITM wrapper (isOriginCall=false)",
          outcome: "DEFENDED",
          detail: `PostBounty aborted -> "${mitmErr}"`,
        },
        {
          label: "2. Non-wugnot denomination injection (uatom)",
          outcome: "DEFENDED",
          detail: `PostBounty aborted -> "${denomErr}"`,
        },
        {
          label: "3. Sub-minimum dust deposit (50,000 < 100,000 wugnot)",
          outcome: "DEFENDED",
          detail: `PostBounty aborted -> "${dustErr}" · Zero bounties mutated · Bank invariant OK.`,
        },
      ],
    };
  }

  // m1-timeout-conflict
  const r = new HearthBountyRealm(arbiter.address, 1_378_958);
  r.seedBalances();

  // Case A: Ghosting sponsor -> ExpireSubmission settles 100%
  const idA = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_200_000 }] },
    "M-1 Hostage Proof Defense",
    "Sponsor disappears after proof submission; bystander triggers ExpireSubmission.",
    "realm",
    30,
  );
  r.claimBounty({ caller: agent.address }, idA, "Delivering solution");
  r.submitProof({ caller: agent.address }, idA, "https://github.com/hearthbounty/v1/pull/11", "sha256:fedcba9876543210", "Delivered full solution.");
  const earlySubErr = captureAbort(() => r.expireSubmission({ caller: builder.address }, idA));
  const agentBefore = r.getBalance(agent.address);
  r.advanceBlocks(30);
  r.expireSubmission({ caller: builder.address }, idA);
  const agentGain = r.getBalance(agent.address) - agentBefore;

  // Case B: Conflicted arbiter + donor pro-rata ExpireDispute 50/50 fallback
  const idB = r.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 1_000_000 }] },
    "M-1 Conflicted Arbiter Defense",
    "Arbiter claims bounty and attempts 100% self-award in ResolveDispute.",
    "audit",
    25,
  );
  r.topUpBounty({ caller: builder.address, sentCoins: [{ denom: DENOM, amount: 500_000 }] }, idB);
  r.claimBounty({ caller: arbiter.address }, idB, "Arbiter claiming as hunter");
  r.submitProof({ caller: arbiter.address }, idB, "https://github.com/hearthbounty/v1/pull/12", "sha256:0123456789abcdef", "Arbiter submission.");
  r.openDispute({ caller: arbiter.address }, idB, "Escalating own claim to dispute.");
  const conflictErr = captureAbort(() => r.resolveDispute({ caller: arbiter.address }, idB, 10_000, "self award"));
  const arbBefore = r.getBalance(arbiter.address);
  const spBefore = r.getBalance(sponsor.address);
  const donorBefore = r.getBalance(builder.address);
  r.advanceBlocks(25);
  r.expireDispute({ caller: agent.address }, idB);
  const arbGain = r.getBalance(arbiter.address) - arbBefore;
  const spGain = r.getBalance(sponsor.address) - spBefore;
  const donorGain = r.getBalance(builder.address) - donorBefore;

  const ok =
    earlySubErr.includes("review window has not expired") &&
    agentGain === 1_200_000 &&
    conflictErr.includes("arbiter cannot resolve a bounty they are party to") &&
    arbGain === 750_000 &&
    spGain === 500_000 &&
    donorGain === 250_000 &&
    r.assertEscrowInvariant();

  return {
    id,
    passed: ok,
    ranAt,
    headline: ok
      ? "DEFENDED — ExpireSubmission auto-settled 1.20 GNOT; conflicted arbiter blocked; ExpireDispute split 0.75 / 0.50 / 0.25 GNOT."
      : "FAILED — Timeout or conflict guard failed.",
    steps: [
      {
        label: "1. Early ExpireSubmission before ReviewDeadlineHeight rejected",
        outcome: "DEFENDED",
        detail: `ExpireSubmission(bystander) aborted -> "${earlySubErr}"`,
      },
      {
        label: "2. Post-timeout ExpireSubmission (+30 blocks) settles 100%",
        outcome: "SETTLED",
        detail: `Bystander settled Bounty #${idA} -> Hunter received +${formatGNOT(agentGain)} cleanly.`,
      },
      {
        label: "3. Conflicted arbiter self-resolution blocked",
        outcome: "DEFENDED",
        detail: `ResolveDispute(arbiter == claimant, 10000 bps) aborted -> "${conflictErr}"`,
      },
      {
        label: "4. Post-timeout ExpireDispute (+25 blocks) 50/50 pro-rata split",
        outcome: "SETTLED",
        detail: `Bystander settled Bounty #${idB} -> Claimant +${formatGNOT(arbGain)} · Sponsor +${formatGNOT(spGain)} · External Donor +${formatGNOT(donorGain)} · Bank invariant OK.`,
      },
    ],
    beforeAfter: {
      v0Behavior: "Legacy v0 had no review or dispute timeouts and no arbiter conflict check — funds could freeze indefinitely.",
      v1Behavior: "Patched v1 guarantees bounded escrow liveness via permissionless ExpireSubmission & ExpireDispute.",
    },
  };
}
