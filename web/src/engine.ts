/**
 * Exact TypeScript mirror of:
 *   - gno.land/p/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthcore/v0
 *   - gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1
 *
 * Mirrors V2.1 hardened escrow semantics:
 *   - 1:1 ugnot-backed wugnot escrow via gno.land/r/nt/grc20reg/v0
 *   - H-1 per-contributor AVL donor custody & claimant/donor wash guards
 *   - M-1 ExpireSubmission, ExpireDispute (50/50), and arbiter conflict guard
 *   - M-2 byte/code-unit ASCII-folding NeutralizeGnoTags immune to U+0130 'İ'
 *   - HTTPS-only proof links, exact deadline block expiry, canonical realm_path
 */

export const DENOM = "ugnot";
export const ESCROW_TOKEN_KEY = "gno.land/r/gnoland/wugnot.wugnot";
export const UGNOT_PER_GNOT = 1_000_000;
export const MIN_REWARD_UGNOT = 100_000;
export const MIN_TOPUP_UGNOT = 100_000;
export const MAX_ESCROW_UGNOT = 1_000_000_000_000;
export const MAX_EXTERNAL_DONORS = 20;
export const MIN_DEADLINE_BLOCKS = 10;
export const MAX_DEADLINE_BLOCKS = 2_000_000;
export const DEFAULT_DEADLINE_BLOCKS = 50_000;
export const MAX_BPS = 10_000;

export const MAX_TITLE_LEN = 120;
export const MAX_SPEC_LEN = 4000;
export const MAX_NOTE_LEN = 600;
export const MAX_URL_LEN = 300;
export const MAX_DIGEST_LEN = 128;
export const MAX_HANDLE_LEN = 40;
export const MAX_BIO_LEN = 300;
export const MAX_SKILLS_LEN = 200;
export const MAX_ENDPOINT_LEN = 240;

export const DEPLOYER_NAMESPACE = "g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4";
export const CORE_PKG_PATH = `gno.land/p/${DEPLOYER_NAMESPACE}/hearthcore/v0`;
export const REALM_PKG_PATH = `gno.land/r/${DEPLOYER_NAMESPACE}/hearthbounty/v1`;
export const REALM_WEB_BASE = `/r/${DEPLOYER_NAMESPACE}/hearthbounty/v1`;
export const REALM_ESCROW_ADDRESS = "g1dkvpnfcp8saevy2g46x9z2ljyj9saez6akm39a";
export const GUILD_PKG_PATH = `gno.land/r/${DEPLOYER_NAMESPACE}/hearthguild/v0`;
export const GUILD_WEB_BASE = `/r/${DEPLOYER_NAMESPACE}/hearthguild/v0`;
export const LEGACY_V0_PKG_PATH = `gno.land/r/${DEPLOYER_NAMESPACE}/hearthbounty/v0`;

export const VALID_STATUSES = [
  "open",
  "claimed",
  "submitted",
  "disputed",
  "settled",
  "cancelled",
] as const;
export type BountyStatus = (typeof VALID_STATUSES)[number];

export const VALID_CATEGORIES = ["realm", "tool", "audit", "docs", "agent"] as const;
export type BountyCategory = (typeof VALID_CATEGORIES)[number];

export type ReputationTier = "Apprentice" | "Journeyman" | "Master" | "Guildmaster";

export const CATEGORY_LABELS: Record<BountyCategory, string> = {
  realm: "Realm",
  tool: "Tooling",
  audit: "Security Audit",
  docs: "Docs & Guides",
  agent: "AI Agent",
};

export const STATUS_LABELS: Record<BountyStatus, string> = {
  open: "Open",
  claimed: "Claimed",
  submitted: "Submitted",
  disputed: "Disputed",
  settled: "Settled",
  cancelled: "Cancelled",
};

export interface BountyRecord {
  id: number;
  title: string;
  spec: string;
  category: BountyCategory;
  status: BountyStatus;
  sponsor: string;
  claimant: string;
  claimNote: string;
  escrowUgnot: number;
  initialUgnot: number;
  sponsorFundedUgnot: number;
  externalTopUpUgnot: number;
  donorShares: Record<string, number>;
  payoutUgnot: number;
  refundUgnot: number;
  topUpCount: number;
  deadlineBlocks: number;
  createdHeight: number;
  claimedHeight: number;
  deadlineHeight: number;
  submittedHeight: number;
  reviewDeadlineHeight: number;
  disputedHeight: number;
  disputeDeadlineHeight: number;
  settledHeight: number;
  proofURL: string;
  proofDigest: string;
  proofSummary: string;
  submissionCount: number;
  revisionFeedback: string;
  rating: number;
  reviewNote: string;
  disputeReason: string;
  disputeOpenedBy: string;
}

export interface ProfileRecord {
  address: string;
  handle: string;
  bio: string;
  skills: string;
  agentEndpoint: string;
  isAgent: boolean;
  postedCount: number;
  claimedCount: number;
  settledCount: number;
  sponsoredSettled: number;
  earnedUgnot: number;
  sponsoredUgnot: number;
  ratingSum: number;
  ratingCount: number;
  registeredHeight: number;
}

export interface ProfileView extends ProfileRecord {
  tier: ReputationTier;
  earnedFormatted: string;
  ratingFormatted: string;
}

export interface BoardStats {
  realm_path: string;
  web_path: string;
  escrow_token: string;
  escrow_address: string;
  arbiter: string;
  chain_height: number;
  total_bounties: number;
  open_count: number;
  claimed_count: number;
  submitted_count: number;
  disputed_count: number;
  settled_count: number;
  cancelled_count: number;
  profile_count: number;
  agent_count: number;
  total_escrow_ugnot: number;
  total_settled_ugnot: number;
  total_refund_ugnot: number;
}

export interface CallContext {
  caller: string;
  isOriginCall?: boolean;
  isUserCall?: boolean;
  sentCoins?: Array<{ denom: string; amount: number }>;
  tokenKey?: string;
}

export interface TraceEntry {
  seq: number;
  height: number;
  func: string;
  caller: string;
  callerHandle: string;
  ok: boolean;
  eventType?: string;
  attrs?: Record<string, string>;
  error?: string;
  escrowInvariantOk: boolean;
  realmBankUgnot: number;
  totalEscrowUgnot: number;
}

export interface ActorPreset {
  id: "sponsor" | "agent" | "builder" | "arbiter";
  label: string;
  role: string;
  address: string;
  handle: string;
  isAgent: boolean;
}

export const DEMO_ACTORS: ActorPreset[] = [
  {
    id: "sponsor",
    label: "Sponsor",
    role: "EOA Protocol Sponsor",
    address: "g1jg8mtutu9khhfwc4nxmuhcpftf0pajdhfvsqf5",
    handle: "tavern-keeper",
    isAgent: false,
  },
  {
    id: "agent",
    label: "AI Agent",
    role: "Autonomous MCP Agent",
    address: "g1us8428u2a5satrlxzagqqa5m6vmuze025anjlj",
    handle: "anvil-mcp-agent",
    isAgent: true,
  },
  {
    id: "builder",
    label: "Builder",
    role: "Human Gno Developer",
    address: "g14a7n5z20x6y8q0w3e9r2t5y8u1i4o7p0a3s6d9",
    handle: "ironforge-dev",
    isAgent: false,
  },
  {
    id: "arbiter",
    label: "Arbiter",
    role: "Dispute Resolution Arbiter",
    address: DEPLOYER_NAMESPACE,
    handle: "hearth-arbiter",
    isAgent: false,
  },
];

// --- Pure functions mirroring hearthcore/v0 + hearthbounty/v1/sanitize.gno ---

export function computeTier(
  settledCount: number,
  earnedUgnot: number,
  ratingSum: number,
  ratingCount: number,
): ReputationTier {
  const highQuality = ratingCount === 0 || ratingSum * 10 >= ratingCount * 45;
  if ((settledCount >= 10 || earnedUgnot >= 500 * UGNOT_PER_GNOT) && highQuality) {
    return "Guildmaster";
  }
  if (settledCount >= 5 || earnedUgnot >= 100 * UGNOT_PER_GNOT) {
    return "Master";
  }
  if (settledCount >= 2 || earnedUgnot >= 10 * UGNOT_PER_GNOT) {
    return "Journeyman";
  }
  return "Apprentice";
}

export function tierColor(tier: ReputationTier): string {
  switch (tier) {
    case "Guildmaster":
      return "#f59e0b";
    case "Master":
      return "#a78bfa";
    case "Journeyman":
      return "#38bdf8";
    default:
      return "#34d399";
  }
}

export function computeSplit(
  escrowUgnot: number,
  hunterBps: number,
): { hunterUgnot: number; sponsorRefundUgnot: number } {
  if (!Number.isInteger(escrowUgnot) || escrowUgnot < 0) {
    throw new Error("hearthcore: negative escrow amount");
  }
  if (!Number.isInteger(hunterBps) || hunterBps < 0 || hunterBps > MAX_BPS) {
    throw new Error("hearthcore: hunterBps exceeds 10000");
  }
  if (hunterBps === 0) {
    return { hunterUgnot: 0, sponsorRefundUgnot: escrowUgnot };
  }
  if (hunterBps === MAX_BPS) {
    return { hunterUgnot: escrowUgnot, sponsorRefundUgnot: 0 };
  }
  const e = BigInt(escrowUgnot);
  const bps = BigInt(hunterBps);
  const max = BigInt(MAX_BPS);
  const q = e / max;
  const r = e % max;
  const hunter = q * bps + (r * bps) / max;
  const sponsor = e - hunter;
  return { hunterUgnot: Number(hunter), sponsorRefundUgnot: Number(sponsor) };
}

export function formatGNOT(ugnot: number): string {
  const neg = ugnot < 0;
  const abs = Math.abs(Math.trunc(ugnot));
  const whole = Math.floor(abs / UGNOT_PER_GNOT);
  const frac = abs % UGNOT_PER_GNOT;
  const prefix = neg ? "-" : "";
  if (frac === 0) {
    return `${prefix}${whole}.00 GNOT`;
  }
  const fracStr = frac.toString().padStart(6, "0");
  const trimmed = fracStr.replace(/0+$/, "");
  const padded = trimmed.length < 2 ? fracStr.slice(0, 2) : trimmed;
  return `${prefix}${whole}.${padded} GNOT`;
}

export function formatRating(sum: number, count: number): string {
  if (count === 0) {
    return "Unrated";
  }
  const tenths = Math.floor((sum * 10 + Math.floor(count / 2)) / count);
  const whole = Math.floor(tenths / 10);
  const rem = tenths % 10;
  return `${whole}.${rem} / 5.0`;
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length <= 14) {
    return addr;
  }
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

export function escapeMath(s: string): string {
  return s.replaceAll("$", "\\$");
}

function asciiLowerCode(code: number): number {
  return code >= 65 && code <= 90 ? code + 32 : code;
}

function hasAsciiPrefixFold(s: string, pos: number, pattern: string): boolean {
  if (pos + pattern.length > s.length) return false;
  for (let j = 0; j < pattern.length; j++) {
    if (asciiLowerCode(s.charCodeAt(pos + j)) !== pattern.charCodeAt(j)) {
      return false;
    }
  }
  return true;
}

/**
 * Legacy v0 algorithm preserved strictly for the Adversarial Breaker Lab
 * before/after demonstration of the U+0130 ('İ') index-desync bug (M-2).
 */
export function legacyVulnerableNeutralizeGnoTagsV0(s: string): string {
  const lower = s.toLowerCase();
  if (!lower.includes("<gno-") && !lower.includes("</gno-")) {
    return s;
  }
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "<") {
      const rem = lower.slice(i);
      if (rem.startsWith("<gno-") || rem.startsWith("</gno-")) {
        out += "&lt;";
        continue;
      }
    }
    out += s[i];
  }
  return out;
}

/**
 * Patched V2.1 NeutralizeGnoTags mirroring hearthbounty/v1/sanitize.gno.
 * Uses direct ASCII case folding on original indices so multi-unit Unicode
 * expansions (such as U+0130 'İ' -> "i\u0307") never desync tag detection.
 */
export function neutralizeGnoTags(s: string): string {
  let out = "";
  let changed = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "<" && (hasAsciiPrefixFold(s, i, "<gno-") || hasAsciiPrefixFold(s, i, "</gno-"))) {
      if (!changed) {
        out = s.slice(0, i);
        changed = true;
      }
      out += "&lt;";
      continue;
    }
    if (changed) {
      out += s[i];
    }
  }
  return changed ? out : s;
}

export function sanitizeRenderText(s: string): string {
  const stripped = s
    .replaceAll("<script", "&lt;script")
    .replaceAll("</script", "&lt;/script");
  return neutralizeGnoTags(escapeMath(stripped));
}

export function parseCategory(raw: string): BountyCategory | null {
  const c = raw.trim().toLowerCase() as BountyCategory;
  return VALID_CATEGORIES.includes(c) ? c : null;
}

export function validateText(field: string, value: string, minLen: number, maxLen: number): string {
  const trimmed = value.trim();
  if (trimmed.length < minLen) {
    throw new Error(`hearthcore: ${field} is too short`);
  }
  if (trimmed.length > maxLen) {
    throw new Error(`hearthcore: ${field} exceeds maximum length`);
  }
  return trimmed;
}

export function validateProofURL(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length < 12) {
    throw new Error("hearthbounty: proof URL is too short");
  }
  if (trimmed.length > MAX_URL_LEN) {
    throw new Error("hearthbounty: proof URL exceeds maximum length");
  }
  if (!trimmed.startsWith("https://")) {
    throw new Error("hearthbounty: proof URL must start with https://");
  }
  if (/[\s]/.test(trimmed)) {
    throw new Error("hearthbounty: proof URL must not contain whitespace");
  }
  return trimmed;
}

export function validateProofDigest(raw: string): string {
  const trimmed = validateText("proof digest", raw, 8, MAX_DIGEST_LEN);
  if (/[\s]/.test(trimmed)) {
    throw new Error("hearthcore: proof digest must not contain whitespace");
  }
  return trimmed;
}

export function validateDeadlineBlocks(blocks: number): number {
  if (blocks === 0) {
    return DEFAULT_DEADLINE_BLOCKS;
  }
  if (!Number.isInteger(blocks) || blocks < MIN_DEADLINE_BLOCKS || blocks > MAX_DEADLINE_BLOCKS) {
    throw new Error("hearthcore: deadlineBlocks out of allowed range");
  }
  return blocks;
}

export function validateRating(rating: number): number {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("hearthcore: rating must be between 1 and 5");
  }
  return rating;
}

export function effectiveReward(b: BountyRecord): number {
  if (b.escrowUgnot > 0) return b.escrowUgnot;
  if (b.payoutUgnot > 0) return b.payoutUgnot;
  if (b.refundUgnot > 0) return b.refundUgnot;
  return b.initialUgnot;
}

export async function computeSha256Digest(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}

// --- Stateful Realm Engine mirroring hearthbounty/v1 ---

export class HearthBountyRealm {
  arbiter: string;
  chainHeight: number;
  bountySeq = 0;
  bounties = new Map<number, BountyRecord>();
  profiles = new Map<string, ProfileRecord>();
  balances = new Map<string, number>();
  realmBankUgnot = 0;
  totalEscrowUgnot = 0;
  totalSettledUgnot = 0;
  totalRefundUgnot = 0;
  openCount = 0;
  claimedCount = 0;
  submittedCount = 0;
  disputedCount = 0;
  settledCount = 0;
  cancelledCount = 0;
  agentCount = 0;
  trace: TraceEntry[] = [];
  private traceSeq = 0;

  constructor(initialArbiter = DEPLOYER_NAMESPACE, startHeight = 1_378_958) {
    this.arbiter = initialArbiter;
    this.chainHeight = startHeight;
  }

  seedBalances(): void {
    for (const actor of DEMO_ACTORS) {
      this.balances.set(actor.address, 250_000_000); // 250.00 GNOT (1:1 wugnot) each
    }
  }

  getBalance(addr: string): number {
    return this.balances.get(addr) ?? 100_000_000;
  }

  advanceBlocks(delta: number): number {
    if (!Number.isInteger(delta) || delta < 1) {
      throw new Error("Block advance must be a positive integer.");
    }
    this.chainHeight += delta;
    return this.chainHeight;
  }

  assertEscrowInvariant(): boolean {
    return this.realmBankUgnot === this.totalEscrowUgnot;
  }

  getDonorContribution(id: number, donor: string): number {
    const b = this.bounties.get(id);
    if (!b) return 0;
    return b.donorShares[donor] ?? 0;
  }

  private getOrCreateProfile(addr: string): ProfileRecord {
    const existing = this.profiles.get(addr);
    if (existing) return existing;
    const created: ProfileRecord = {
      address: addr,
      handle: shortAddr(addr),
      bio: "",
      skills: "",
      agentEndpoint: "",
      isAgent: false,
      postedCount: 0,
      claimedCount: 0,
      settledCount: 0,
      sponsoredSettled: 0,
      earnedUgnot: 0,
      sponsoredUgnot: 0,
      ratingSum: 0,
      ratingCount: 0,
      registeredHeight: this.chainHeight,
    };
    this.profiles.set(addr, created);
    return created;
  }

  private decrementSponsoredCredit(addr: string, amount: number): void {
    if (amount <= 0) return;
    const p = this.profiles.get(addr);
    if (!p) return;
    p.sponsoredUgnot = p.sponsoredUgnot >= amount ? p.sponsoredUgnot - amount : 0;
  }

  private displayHandle(addr: string): string {
    return this.profiles.get(addr)?.handle ?? shortAddr(addr);
  }

  private transitionStatus(b: BountyRecord, next: BountyStatus): void {
    if (b.status === next) return;
    this.bumpCount(b.status, -1);
    b.status = next;
    this.bumpCount(next, 1);
  }

  private bumpCount(st: BountyStatus, delta: number): void {
    switch (st) {
      case "open":
        this.openCount += delta;
        break;
      case "claimed":
        this.claimedCount += delta;
        break;
      case "submitted":
        this.submittedCount += delta;
        break;
      case "disputed":
        this.disputedCount += delta;
        break;
      case "settled":
        this.settledCount += delta;
        break;
      case "cancelled":
        this.cancelledCount += delta;
        break;
    }
  }

  private recordTrace(
    func: string,
    caller: string,
    ok: boolean,
    eventType?: string,
    attrs?: Record<string, string>,
    error?: string,
  ): void {
    this.traceSeq += 1;
    this.trace.unshift({
      seq: this.traceSeq,
      height: this.chainHeight,
      func,
      caller,
      callerHandle: this.displayHandle(caller),
      ok,
      eventType,
      attrs,
      error,
      escrowInvariantOk: this.assertEscrowInvariant(),
      realmBankUgnot: this.realmBankUgnot,
      totalEscrowUgnot: this.totalEscrowUgnot,
    });
    if (this.trace.length > 80) {
      this.trace.length = 80;
    }
  }

  private requireDirectEOA(ctx: CallContext, actionLabel: string): void {
    if (ctx.isOriginCall === false) {
      throw new Error("invalid non-origin call");
    }
    if (ctx.isUserCall === false) {
      throw new Error(`hearthbounty: direct EOA call required to ${actionLabel}`);
    }
  }

  private requireWugnotEscrow(ctx: CallContext, minAmount: number): number {
    if (ctx.tokenKey && ctx.tokenKey !== ESCROW_TOKEN_KEY) {
      throw new Error("hearthbounty: only 1:1 ugnot-backed wugnot escrow is accepted");
    }
    const sent = ctx.sentCoins ?? [];
    if (sent.length === 0) {
      throw new Error("hearthbounty: escrow amount is below minimum required (100000 wugnot)");
    }
    if (sent.length !== 1 || (sent[0].denom !== DENOM && sent[0].denom !== "wugnot")) {
      throw new Error("hearthbounty: only 1:1 ugnot-backed wugnot escrow is accepted");
    }
    const amt = sent[0].amount;
    if (!Number.isInteger(amt) || amt < minAmount) {
      throw new Error("hearthbounty: escrow amount is below minimum required (100000 wugnot)");
    }
    if (amt > MAX_ESCROW_UGNOT) {
      throw new Error("hearthbounty: escrow amount exceeds single-bounty safety ceiling");
    }
    const bal = this.getBalance(ctx.caller);
    if (bal < amt) {
      throw new Error("grc20reg: insufficient wugnot balance for escrow deposit");
    }
    return amt;
  }

  private credit(addr: string, amount: number): void {
    this.balances.set(addr, this.getBalance(addr) + amount);
  }

  private debit(addr: string, amount: number): void {
    this.balances.set(addr, this.getBalance(addr) - amount);
  }

  private runGuarded<T>(
    func: string,
    caller: string,
    fn: () => { result: T; eventType: string; attrs: Record<string, string> },
  ): T {
    try {
      const { result, eventType, attrs } = fn();
      this.chainHeight += 1;
      this.recordTrace(func, caller, true, eventType, attrs);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.recordTrace(func, caller, false, undefined, undefined, msg);
      throw err;
    }
  }

  setArbiter(ctx: CallContext, next: string): void {
    this.runGuarded("SetArbiter", ctx.caller, () => {
      if (ctx.caller !== this.arbiter) {
        throw new Error("hearthbounty: only current arbiter may transfer arbiter role");
      }
      if (!next.startsWith("g1") || next.length < 16) {
        throw new Error("hearthbounty: next arbiter address is invalid");
      }
      const prev = this.arbiter;
      this.arbiter = next;
      return {
        result: undefined,
        eventType: "ArbiterUpdated",
        attrs: { previous: prev, arbiter: next },
      };
    });
  }

  registerProfile(
    ctx: CallContext,
    handle: string,
    bio: string,
    skills: string,
    agentEndpoint: string,
  ): ProfileView {
    return this.runGuarded("RegisterProfile", ctx.caller, () => {
      const cleanHandle = validateText("handle", handle, 2, MAX_HANDLE_LEN);
      const cleanBio = validateText("bio", bio, 0, MAX_BIO_LEN);
      const cleanSkills = validateText("skills", skills, 0, MAX_SKILLS_LEN);
      const cleanEndpoint = validateText("agentEndpoint", agentEndpoint, 0, MAX_ENDPOINT_LEN);

      const p = this.getOrCreateProfile(ctx.caller);
      const wasAgent = p.isAgent;
      p.handle = cleanHandle;
      p.bio = cleanBio;
      p.skills = cleanSkills;
      p.agentEndpoint = cleanEndpoint;
      p.isAgent = cleanEndpoint !== "";

      if (!wasAgent && p.isAgent) this.agentCount += 1;
      else if (wasAgent && !p.isAgent) this.agentCount -= 1;

      return {
        result: this.toProfileView(p),
        eventType: "ProfileRegistered",
        attrs: { address: ctx.caller, handle: cleanHandle, is_agent: String(p.isAgent) },
      };
    });
  }

  postBounty(
    ctx: CallContext,
    title: string,
    spec: string,
    category: string,
    deadlineBlocks: number,
  ): number {
    return this.runGuarded("PostBounty", ctx.caller, () => {
      this.requireDirectEOA(ctx, "fund escrow");
      const amount = this.requireWugnotEscrow(ctx, MIN_REWARD_UGNOT);
      const cleanTitle = validateText("title", title, 4, MAX_TITLE_LEN);
      const cleanSpec = validateText("spec", spec, 10, MAX_SPEC_LEN);
      const cat = parseCategory(category);
      if (!cat) {
        throw new Error("hearthbounty: invalid category (use realm, tool, audit, docs, or agent)");
      }
      const blocks = validateDeadlineBlocks(deadlineBlocks);

      this.debit(ctx.caller, amount);
      this.realmBankUgnot += amount;

      this.bountySeq += 1;
      const id = this.bountySeq;
      const rec: BountyRecord = {
        id,
        title: cleanTitle,
        spec: cleanSpec,
        category: cat,
        status: "open",
        sponsor: ctx.caller,
        claimant: "",
        claimNote: "",
        escrowUgnot: amount,
        initialUgnot: amount,
        sponsorFundedUgnot: amount,
        externalTopUpUgnot: 0,
        donorShares: {},
        payoutUgnot: 0,
        refundUgnot: 0,
        topUpCount: 0,
        deadlineBlocks: blocks,
        createdHeight: this.chainHeight,
        claimedHeight: 0,
        deadlineHeight: 0,
        submittedHeight: 0,
        reviewDeadlineHeight: 0,
        disputedHeight: 0,
        disputeDeadlineHeight: 0,
        settledHeight: 0,
        proofURL: "",
        proofDigest: "",
        proofSummary: "",
        submissionCount: 0,
        revisionFeedback: "",
        rating: 0,
        reviewNote: "",
        disputeReason: "",
        disputeOpenedBy: "",
      };

      this.bounties.set(id, rec);
      this.openCount += 1;
      this.totalEscrowUgnot += amount;

      const sp = this.getOrCreateProfile(ctx.caller);
      sp.postedCount += 1;
      sp.sponsoredUgnot += amount;

      return {
        result: id,
        eventType: "BountyPosted",
        attrs: {
          id: String(id),
          sponsor: ctx.caller,
          category: cat,
          escrow_token: ESCROW_TOKEN_KEY,
          escrow_ugnot: String(amount),
          deadline_blocks: String(blocks),
        },
      };
    });
  }

  topUpBounty(ctx: CallContext, id: number): number {
    return this.runGuarded("TopUpBounty", ctx.caller, () => {
      this.requireDirectEOA(ctx, "top up escrow");
      const amount = this.requireWugnotEscrow(ctx, MIN_TOPUP_UGNOT);
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "open" && b.status !== "claimed") {
        throw new Error("hearthbounty: can only top up open or claimed bounties");
      }
      if (b.claimant && ctx.caller === b.claimant) {
        throw new Error("hearthbounty: active claimant cannot top up own claimed bounty");
      }
      if (b.escrowUgnot + amount > MAX_ESCROW_UGNOT) {
        throw new Error("hearthbounty: escrow total exceeds single-bounty safety ceiling");
      }
      const isExternal = ctx.caller !== b.sponsor;
      if (isExternal && !(ctx.caller in b.donorShares) && Object.keys(b.donorShares).length >= MAX_EXTERNAL_DONORS) {
        throw new Error("hearthbounty: external donor cap reached for this bounty");
      }

      this.debit(ctx.caller, amount);
      this.realmBankUgnot += amount;

      if (isExternal) {
        b.donorShares[ctx.caller] = (b.donorShares[ctx.caller] ?? 0) + amount;
        b.externalTopUpUgnot += amount;
      } else {
        b.sponsorFundedUgnot += amount;
      }
      b.escrowUgnot += amount;
      b.topUpCount += 1;
      this.totalEscrowUgnot += amount;

      const dp = this.getOrCreateProfile(ctx.caller);
      dp.sponsoredUgnot += amount;

      return {
        result: b.escrowUgnot,
        eventType: "BountyToppedUp",
        attrs: {
          id: String(id),
          donor: ctx.caller,
          added_ugnot: String(amount),
          escrow_ugnot: String(b.escrowUgnot),
        },
      };
    });
  }

  claimBounty(ctx: CallContext, id: number, agentNote: string): void {
    this.runGuarded("ClaimBounty", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "open") {
        throw new Error("hearthbounty: bounty is not open for claiming");
      }
      if (ctx.caller === b.sponsor) {
        throw new Error("hearthbounty: sponsor cannot claim own bounty");
      }
      if (ctx.caller in b.donorShares && b.donorShares[ctx.caller] > 0) {
        throw new Error("hearthbounty: escrow contributor cannot claim own funded bounty");
      }
      const cleanNote = validateText("agentNote", agentNote, 0, MAX_NOTE_LEN);

      this.transitionStatus(b, "claimed");
      b.claimant = ctx.caller;
      b.claimNote = cleanNote;
      b.claimedHeight = this.chainHeight;
      b.deadlineHeight = this.chainHeight + b.deadlineBlocks;

      const hp = this.getOrCreateProfile(ctx.caller);
      hp.claimedCount += 1;

      return {
        result: undefined,
        eventType: "BountyClaimed",
        attrs: {
          id: String(id),
          claimant: ctx.caller,
          deadline_height: String(b.deadlineHeight),
        },
      };
    });
  }

  releaseExpiredClaim(ctx: CallContext, id: number): void {
    this.runGuarded("ReleaseExpiredClaim", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "claimed") {
        throw new Error("hearthbounty: bounty is not currently claimed");
      }
      if (ctx.caller !== b.claimant && this.chainHeight < b.deadlineHeight) {
        throw new Error("hearthbounty: claim deadline has not expired yet");
      }
      const prevClaimant = b.claimant;
      const prevProf = this.profiles.get(prevClaimant);
      if (prevProf && prevProf.claimedCount > 0) {
        prevProf.claimedCount -= 1;
      }

      this.transitionStatus(b, "open");
      b.claimant = "";
      b.claimNote = "";
      b.claimedHeight = 0;
      b.deadlineHeight = 0;
      b.submittedHeight = 0;
      b.reviewDeadlineHeight = 0;
      b.proofURL = "";
      b.proofDigest = "";
      b.proofSummary = "";
      b.revisionFeedback = "";

      return {
        result: undefined,
        eventType: "ClaimReleased",
        attrs: {
          id: String(id),
          previous_claimant: prevClaimant,
          released_by: ctx.caller,
        },
      };
    });
  }

  submitProof(
    ctx: CallContext,
    id: number,
    proofURL: string,
    proofDigest: string,
    summary: string,
  ): void {
    this.runGuarded("SubmitProof", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "claimed") {
        throw new Error("hearthbounty: bounty must be claimed before submitting proof");
      }
      if (ctx.caller !== b.claimant) {
        throw new Error("hearthbounty: only the active claimant may submit proof");
      }
      const cleanURL = validateProofURL(proofURL);
      const cleanDigest = validateProofDigest(proofDigest);
      const cleanSummary = validateText("summary", summary, 6, MAX_NOTE_LEN);

      this.transitionStatus(b, "submitted");
      b.proofURL = cleanURL;
      b.proofDigest = cleanDigest;
      b.proofSummary = cleanSummary;
      b.submittedHeight = this.chainHeight;
      b.reviewDeadlineHeight = this.chainHeight + b.deadlineBlocks;
      b.submissionCount += 1;
      b.revisionFeedback = "";

      return {
        result: undefined,
        eventType: "ProofSubmitted",
        attrs: {
          id: String(id),
          claimant: ctx.caller,
          proof_digest: cleanDigest,
          review_deadline_height: String(b.reviewDeadlineHeight),
          submission_count: String(b.submissionCount),
        },
      };
    });
  }

  requestRevision(ctx: CallContext, id: number, feedback: string): void {
    this.runGuarded("RequestRevision", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "submitted") {
        throw new Error("hearthbounty: bounty has no pending submission");
      }
      if (ctx.caller !== b.sponsor) {
        throw new Error("hearthbounty: only the sponsor may request a revision");
      }
      const cleanFeedback = validateText("feedback", feedback, 4, MAX_NOTE_LEN);
      this.transitionStatus(b, "claimed");
      b.revisionFeedback = cleanFeedback;
      b.reviewDeadlineHeight = 0;
      b.deadlineHeight = this.chainHeight + b.deadlineBlocks;

      return {
        result: undefined,
        eventType: "RevisionRequested",
        attrs: {
          id: String(id),
          sponsor: ctx.caller,
          new_deadline_height: String(b.deadlineHeight),
        },
      };
    });
  }

  private settleFull(b: BountyRecord, rating: number, reviewNote: string, eventType: string) {
    const payout = b.escrowUgnot;
    const recipient = b.claimant;

    // CEI: effects before token transfers
    b.escrowUgnot = 0;
    b.sponsorFundedUgnot = 0;
    b.externalTopUpUgnot = 0;
    b.donorShares = {};
    b.payoutUgnot = payout;
    b.rating = rating;
    b.reviewNote = reviewNote;
    b.settledHeight = this.chainHeight;
    this.transitionStatus(b, "settled");
    this.totalEscrowUgnot -= payout;
    this.totalSettledUgnot += payout;

    const hp = this.getOrCreateProfile(recipient);
    hp.settledCount += 1;
    hp.earnedUgnot += payout;
    if (rating > 0) {
      hp.ratingSum += rating;
      hp.ratingCount += 1;
    }

    const sp = this.getOrCreateProfile(b.sponsor);
    sp.sponsoredSettled += 1;

    if (payout > 0) {
      this.realmBankUgnot -= payout;
      this.credit(recipient, payout);
    }

    return {
      result: undefined,
      eventType,
      attrs: {
        id: String(b.id),
        sponsor: b.sponsor,
        claimant: recipient,
        payout_ugnot: String(payout),
        rating: String(rating),
      },
    };
  }

  approveAndSettle(ctx: CallContext, id: number, rating: number, reviewNote: string): void {
    this.runGuarded("ApproveAndSettle", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "submitted") {
        throw new Error("hearthbounty: bounty is not awaiting approval");
      }
      if (ctx.caller !== b.sponsor) {
        throw new Error("hearthbounty: only the sponsor may approve and settle");
      }
      const validRating = validateRating(rating);
      const cleanNote = validateText("reviewNote", reviewNote, 0, MAX_NOTE_LEN);
      return this.settleFull(b, validRating, cleanNote, "BountySettled");
    });
  }

  expireSubmission(ctx: CallContext, id: number): void {
    this.runGuarded("ExpireSubmission", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "submitted") {
        throw new Error("hearthbounty: bounty has no pending submission");
      }
      if (this.chainHeight < b.reviewDeadlineHeight) {
        throw new Error("hearthbounty: submission review window has not expired yet");
      }
      return this.settleFull(b, 0, "[Auto-Settled] Sponsor review window expired", "SubmissionExpiredSettled");
    });
  }

  cancelBounty(ctx: CallContext, id: number): void {
    this.runGuarded("CancelBounty", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "open") {
        throw new Error("hearthbounty: only open bounties can be cancelled");
      }
      if (ctx.caller !== b.sponsor) {
        throw new Error("hearthbounty: only the sponsor may cancel");
      }

      const totalRefund = b.escrowUgnot;
      const sponsorRefund = b.sponsorFundedUgnot;
      const donorRefunds: Array<{ addr: string; amount: number }> = [];
      let externalRefundTotal = 0;

      for (const addr of Object.keys(b.donorShares).sort()) {
        const amt = b.donorShares[addr];
        if (amt > 0) {
          donorRefunds.push({ addr, amount: amt });
          externalRefundTotal += amt;
        }
      }
      if (sponsorRefund + externalRefundTotal !== totalRefund) {
        throw new Error("hearthbounty: internal escrow custody invariant mismatch");
      }

      // CEI: effects before interactions
      b.escrowUgnot = 0;
      b.sponsorFundedUgnot = 0;
      b.externalTopUpUgnot = 0;
      b.donorShares = {};
      b.refundUgnot = totalRefund;
      this.transitionStatus(b, "cancelled");
      this.totalEscrowUgnot -= totalRefund;
      this.totalRefundUgnot += totalRefund;

      this.decrementSponsoredCredit(b.sponsor, sponsorRefund);
      for (const dr of donorRefunds) {
        this.decrementSponsoredCredit(dr.addr, dr.amount);
      }

      if (sponsorRefund > 0) {
        this.realmBankUgnot -= sponsorRefund;
        this.credit(b.sponsor, sponsorRefund);
      }
      for (const dr of donorRefunds) {
        this.realmBankUgnot -= dr.amount;
        this.credit(dr.addr, dr.amount);
      }

      return {
        result: undefined,
        eventType: "BountyCancelled",
        attrs: {
          id: String(id),
          sponsor: b.sponsor,
          sponsor_refund_ugnot: String(sponsorRefund),
          external_refund_ugnot: String(externalRefundTotal),
          refund_ugnot: String(totalRefund),
        },
      };
    });
  }

  openDispute(ctx: CallContext, id: number, reason: string): void {
    this.runGuarded("OpenDispute", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "submitted") {
        throw new Error("hearthbounty: disputes can only be opened on submitted bounties");
      }
      if (ctx.caller !== b.sponsor && ctx.caller !== b.claimant) {
        throw new Error("hearthbounty: only sponsor or claimant may open a dispute");
      }
      const cleanReason = validateText("reason", reason, 6, MAX_NOTE_LEN);
      this.transitionStatus(b, "disputed");
      b.disputeReason = cleanReason;
      b.disputeOpenedBy = ctx.caller;
      b.disputedHeight = this.chainHeight;
      b.disputeDeadlineHeight = this.chainHeight + b.deadlineBlocks;

      return {
        result: undefined,
        eventType: "DisputeOpened",
        attrs: {
          id: String(id),
          opened_by: ctx.caller,
          dispute_deadline_height: String(b.disputeDeadlineHeight),
          reason: cleanReason,
        },
      };
    });
  }

  private settleDisputeSplit(
    b: BountyRecord,
    hunterBps: number,
    reviewNote: string,
    resolver: string,
    eventType: string,
  ) {
    const escrow = b.escrowUgnot;
    const { sponsorRefundUgnot: sponsorRefund } = computeSplit(b.sponsorFundedUgnot, hunterBps);

    const donorRefunds: Array<{ addr: string; amount: number }> = [];
    let totalRefunds = sponsorRefund;
    for (const addr of Object.keys(b.donorShares).sort()) {
      const amt = b.donorShares[addr];
      if (amt > 0) {
        const { sponsorRefundUgnot: dRefund } = computeSplit(amt, hunterBps);
        if (dRefund > 0) {
          donorRefunds.push({ addr, amount: dRefund });
          totalRefunds += dRefund;
        }
      }
    }
    const hunterShare = escrow - totalRefunds;

    // CEI: effects before transfers
    b.escrowUgnot = 0;
    b.sponsorFundedUgnot = 0;
    b.externalTopUpUgnot = 0;
    b.donorShares = {};
    b.payoutUgnot = hunterShare;
    b.refundUgnot = totalRefunds;
    b.reviewNote = reviewNote;
    b.settledHeight = this.chainHeight;
    this.transitionStatus(b, "settled");
    this.totalEscrowUgnot -= escrow;
    this.totalSettledUgnot += hunterShare;
    this.totalRefundUgnot += totalRefunds;

    if (hunterShare > 0) {
      const hp = this.getOrCreateProfile(b.claimant);
      hp.settledCount += 1;
      hp.earnedUgnot += hunterShare;
    }
    this.decrementSponsoredCredit(b.sponsor, sponsorRefund);
    for (const dr of donorRefunds) {
      this.decrementSponsoredCredit(dr.addr, dr.amount);
    }

    if (hunterShare > 0) {
      this.realmBankUgnot -= hunterShare;
      this.credit(b.claimant, hunterShare);
    }
    if (sponsorRefund > 0) {
      this.realmBankUgnot -= sponsorRefund;
      this.credit(b.sponsor, sponsorRefund);
    }
    for (const dr of donorRefunds) {
      this.realmBankUgnot -= dr.amount;
      this.credit(dr.addr, dr.amount);
    }

    return {
      result: undefined,
      eventType,
      attrs: {
        id: String(b.id),
        resolver,
        hunter_bps: String(hunterBps),
        hunter_ugnot: String(hunterShare),
        sponsor_refund_ugnot: String(sponsorRefund),
        total_refund_ugnot: String(totalRefunds),
      },
    };
  }

  resolveDispute(ctx: CallContext, id: number, hunterBps: number, resolution: string): void {
    this.runGuarded("ResolveDispute", ctx.caller, () => {
      if (ctx.caller !== this.arbiter) {
        throw new Error("hearthbounty: only the arbiter may resolve disputes");
      }
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "disputed") {
        throw new Error("hearthbounty: bounty is not disputed");
      }
      if (ctx.caller === b.sponsor || ctx.caller === b.claimant) {
        throw new Error("hearthbounty: arbiter cannot resolve a bounty they are party to");
      }
      const cleanResolution = validateText("resolution", resolution, 4, MAX_NOTE_LEN);
      return this.settleDisputeSplit(b, hunterBps, `[Arbiter Resolution] ${cleanResolution}`, ctx.caller, "DisputeResolved");
    });
  }

  expireDispute(ctx: CallContext, id: number): void {
    this.runGuarded("ExpireDispute", ctx.caller, () => {
      const b = this.bounties.get(id);
      if (!b) throw new Error("hearthbounty: bounty not found");
      if (b.status !== "disputed") {
        throw new Error("hearthbounty: bounty is not disputed");
      }
      if (this.chainHeight < b.disputeDeadlineHeight) {
        throw new Error("hearthbounty: dispute resolution window has not expired yet");
      }
      return this.settleDisputeSplit(
        b,
        5000,
        "[Timeout Split 50/50] Arbiter resolution window expired",
        ctx.caller,
        "DisputeExpiredSplit",
      );
    });
  }

  // --- Read-Only Queries & Exact JSON Exports (vm/qeval parity) ---

  getStats(): BoardStats {
    return {
      realm_path: REALM_PKG_PATH,
      web_path: REALM_WEB_BASE,
      escrow_token: ESCROW_TOKEN_KEY,
      escrow_address: REALM_ESCROW_ADDRESS,
      arbiter: this.arbiter,
      chain_height: this.chainHeight,
      total_bounties: this.bounties.size,
      open_count: this.openCount,
      claimed_count: this.claimedCount,
      submitted_count: this.submittedCount,
      disputed_count: this.disputedCount,
      settled_count: this.settledCount,
      cancelled_count: this.cancelledCount,
      profile_count: this.profiles.size,
      agent_count: this.agentCount,
      total_escrow_ugnot: this.totalEscrowUgnot,
      total_settled_ugnot: this.totalSettledUgnot,
      total_refund_ugnot: this.totalRefundUgnot,
    };
  }

  toProfileView(p: ProfileRecord): ProfileView {
    return {
      ...p,
      tier: computeTier(p.settledCount, p.earnedUgnot, p.ratingSum, p.ratingCount),
      earnedFormatted: formatGNOT(p.earnedUgnot),
      ratingFormatted: formatRating(p.ratingSum, p.ratingCount),
    };
  }

  getRankedProfiles(): ProfileView[] {
    const list = Array.from(this.profiles.values());
    list.sort((a, b) => {
      if (a.earnedUgnot !== b.earnedUgnot) return b.earnedUgnot - a.earnedUgnot;
      if (a.settledCount !== b.settledCount) return b.settledCount - a.settledCount;
      if (a.sponsoredUgnot !== b.sponsoredUgnot) return b.sponsoredUgnot - a.sponsoredUgnot;
      return a.address.localeCompare(b.address);
    });
    return list.map((p) => this.toProfileView(p));
  }

  getAllBountiesDesc(): BountyRecord[] {
    return Array.from(this.bounties.values()).sort((a, b) => b.id - a.id);
  }

  encodeBountyJSONObj(b: BountyRecord, includeFound: boolean): Record<string, unknown> {
    return {
      ...(includeFound ? { found: true } : {}),
      id: b.id,
      title: b.title,
      spec: b.spec,
      category: b.category,
      status: b.status,
      sponsor: b.sponsor,
      claimant: b.claimant,
      claim_note: b.claimNote,
      escrow_ugnot: b.escrowUgnot,
      initial_ugnot: b.initialUgnot,
      sponsor_funded_ugnot: b.sponsorFundedUgnot,
      external_top_up_ugnot: b.externalTopUpUgnot,
      external_donor_count: Object.keys(b.donorShares).length,
      payout_ugnot: b.payoutUgnot,
      refund_ugnot: b.refundUgnot,
      reward_formatted: formatGNOT(effectiveReward(b)),
      top_up_count: b.topUpCount,
      deadline_blocks: b.deadlineBlocks,
      created_height: b.createdHeight,
      claimed_height: b.claimedHeight,
      deadline_height: b.deadlineHeight,
      submitted_height: b.submittedHeight,
      review_deadline_height: b.reviewDeadlineHeight,
      disputed_height: b.disputedHeight,
      dispute_deadline_height: b.disputeDeadlineHeight,
      settled_height: b.settledHeight,
      proof_url: b.proofURL,
      proof_digest: b.proofDigest,
      proof_summary: b.proofSummary,
      submission_count: b.submissionCount,
      revision_feedback: b.revisionFeedback,
      rating: b.rating,
      review_note: b.reviewNote,
      dispute_reason: b.disputeReason,
      dispute_opened_by: b.disputeOpenedBy,
    };
  }

  encodeProfileJSONObj(p: ProfileView, rank: number): Record<string, unknown> {
    return {
      ...(rank === 0 ? { found: true } : { rank }),
      address: p.address,
      handle: p.handle,
      bio: p.bio,
      skills: p.skills,
      agent_endpoint: p.agentEndpoint,
      is_agent: p.isAgent,
      tier: p.tier,
      posted_count: p.postedCount,
      claimed_count: p.claimedCount,
      settled_count: p.settledCount,
      sponsored_settled: p.sponsoredSettled,
      earned_ugnot: p.earnedUgnot,
      earned_formatted: p.earnedFormatted,
      sponsored_ugnot: p.sponsoredUgnot,
      rating_formatted: p.ratingFormatted,
      rating_sum: p.ratingSum,
      rating_count: p.ratingCount,
    };
  }

  exportStatsJSON(): string {
    return JSON.stringify(this.getStats());
  }

  exportBountyJSON(id: number): string {
    const b = this.bounties.get(id);
    if (!b) return JSON.stringify({ found: false });
    return JSON.stringify(this.encodeBountyJSONObj(b, true));
  }

  exportBountiesJSON(
    statusFilter = "",
    categoryFilter = "",
    minRewardUgnot = 0,
    limit = 50,
  ): string {
    const st = statusFilter.trim().toLowerCase();
    const cat = categoryFilter.trim().toLowerCase();
    const safeLimit = limit <= 0 || limit > 100 ? 50 : limit;
    const items = this.getAllBountiesDesc()
      .filter((b) => (!st || b.status === st) && (!cat || b.category === cat))
      .filter((b) => minRewardUgnot <= 0 || effectiveReward(b) >= minRewardUgnot)
      .slice(0, safeLimit)
      .map((b) => this.encodeBountyJSONObj(b, false));

    return JSON.stringify({
      chain_height: this.chainHeight,
      count: items.length,
      bounties: items,
    });
  }

  exportLeaderboardJSON(limit = 25): string {
    const safeLimit = limit <= 0 || limit > 100 ? 25 : limit;
    const ranked = this.getRankedProfiles().slice(0, safeLimit);
    return JSON.stringify({
      count: ranked.length,
      leaderboard: ranked.map((p, idx) => this.encodeProfileJSONObj(p, idx + 1)),
    });
  }

  exportProfileJSON(addr: string): string {
    const p = this.profiles.get(addr);
    if (!p) return JSON.stringify({ found: false });
    return JSON.stringify(this.encodeProfileJSONObj(this.toProfileView(p), 0));
  }

  renderMarkdown(subPath = ""): string {
    const clean = subPath.replace(/^\/+/, "");
    const stats = this.getStats();
    if (!clean) {
      const rows = this.getAllBountiesDesc()
        .map(
          (b) =>
            `| \`${b.id}\` | **${sanitizeRenderText(b.title)}** | ${CATEGORY_LABELS[b.category]} | **${STATUS_LABELS[b.status]}** | **${formatGNOT(effectiveReward(b))}** |`,
        )
        .join("\n");
      return [
        "# HearthBounty v1",
        "",
        `Active Escrow: **${formatGNOT(stats.total_escrow_ugnot)}** (1:1 wugnot) | Settled Volume: **${formatGNOT(stats.total_settled_ugnot)}** | Block Height: \`${stats.chain_height}\``,
        "",
        "| ID | Bounty | Track | Status | Escrow / Payout |",
        "|---:|---|---|---|---|",
        rows,
      ].join("\n");
    }
    if (clean.startsWith("bounty/")) {
      const id = Number(clean.slice("bounty/".length));
      const b = this.bounties.get(id);
      if (!b) return "# Route Not Found\n\nNo bounty matched that ID.";
      return [
        `# Bounty #${b.id}: ${sanitizeRenderText(b.title)}`,
        "",
        `- **Status:** ${STATUS_LABELS[b.status]}`,
        `- **Escrow:** ${formatGNOT(b.escrowUgnot)} (Sponsor ${formatGNOT(b.sponsorFundedUgnot)} · Donors ${formatGNOT(b.externalTopUpUgnot)})`,
        `- **Sponsor:** \`${b.sponsor}\``,
        b.claimant ? `- **Claimant:** \`${b.claimant}\`` : `- **Claimant:** Open`,
        b.reviewDeadlineHeight ? `- **Review Timeout:** Block #${b.reviewDeadlineHeight}` : "",
        b.disputeDeadlineHeight ? `- **Dispute Timeout:** Block #${b.disputeDeadlineHeight}` : "",
        b.proofURL ? `- **Proof URL:** ${b.proofURL}` : "",
        b.proofDigest ? `- **Digest:** \`${b.proofDigest}\`` : "",
        "",
        sanitizeRenderText(b.spec),
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (clean === "leaderboard") {
      const rows = this.getRankedProfiles()
        .map(
          (p, i) =>
            `| ${i + 1} | ${sanitizeRenderText(p.handle)} | ${p.tier} | ${p.isAgent ? "AI Agent" : "Builder"} | ${p.earnedFormatted} |`,
        )
        .join("\n");
      return ["# Guild Reputation Leaderboard", "", "| Rank | Handle | Tier | Type | Earned |", "|---:|---|---|---|---|", rows].join("\n");
    }
    if (clean === "agents") {
      return [
        "# AI Agent & MCP Hub",
        "",
        `Registered MCP Agents: **${stats.agent_count}**`,
        `Realm Path: \`${REALM_PKG_PATH}\``,
        `Escrow Token: \`${ESCROW_TOKEN_KEY}\` (Spender \`${REALM_ESCROW_ADDRESS}\`)`,
        "JSON Endpoints: `ExportStatsJSON()`, `ExportBountiesJSON(...)`, `ExportBountyJSON(id)`, `ExportLeaderboardJSON(limit)`, `ExportProfileJSON(addr)`",
      ].join("\n");
    }
    return "# Route Not Found";
  }
}

export function createSeededRealm(): HearthBountyRealm {
  const [sponsor, agent, builder, arbiter] = DEMO_ACTORS;
  const realm = new HearthBountyRealm(arbiter.address, 1_378_958);
  realm.seedBalances();

  realm.registerProfile(
    { caller: sponsor.address },
    sponsor.handle,
    "Core protocol maintainer funding reusable Gno.land packages and security audits.",
    "gno,escrow,governance",
    "",
  );
  realm.registerProfile(
    { caller: agent.address },
    agent.handle,
    "Autonomous AI coding agent connected via hearthbounty-mcp and gnomcp; specializes in Gno v1.8 realms and unit tests.",
    "gno,mcp,audit,svg,testing",
    "mcp://anvil.hearthbounty.local/v1",
  );
  realm.registerProfile(
    { caller: builder.address },
    builder.handle,
    "Full-stack Gno builder crafting deterministic AVL data structures and gnoweb dashboards.",
    "gno,avl,gnoweb,typescript",
    "",
  );

  realm.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 12_000_000 }] },
    "Deterministic AVL Leaderboard Paginator",
    "Implement cursor-based pagination over gno.land/p/nt/avl/v0 with zero map iteration and 100% gno test pass.",
    "realm",
    50_000,
  );
  realm.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 5_500_000 }] },
    "Interrealm v2 Payment Guard Fuzz Suite",
    "Write adversarial unit tests covering AssertOriginCall, IsUserCall, and per-contributor refund custody.",
    "audit",
    40_000,
  );
  realm.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 3_200_000 }] },
    "Autonomous Proof Verifier MCP Tool",
    "Extend hearthbounty-mcp with deterministic SHA-256 artifact hashing and live Onyx vm/qpkgmeta_json status checks.",
    "agent",
    30_000,
  );
  realm.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 2_500_000 }] },
    "gnoweb v1.8 SVG Chart Library Guide",
    "Author an interactive developer tutorial demonstrating data:image/svg+xml charts and sanitize/v0 escaping in gnoweb.",
    "docs",
    60_000,
  );
  realm.postBounty(
    { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 4_800_000 }] },
    "CLI Gas & Storage Deposit Estimator",
    "Build a lightweight CLI tool querying auth/gasprice and params/vm:p:storage_price on Onyx testnet prior to addpkg.",
    "tool",
    45_000,
  );

  // #1 -> Settled by anvil-mcp-agent (earns 12.00 GNOT -> Journeyman)
  realm.claimBounty(
    { caller: agent.address },
    1,
    "Discovered via hearth_list_bounties; implementing cursor paginator with O(log N) seeks.",
  );
  realm.submitProof(
    { caller: agent.address },
    1,
    "https://github.com/hearthbounty/avl-pager-demo/pull/1",
    "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "Delivered deterministic AVL cursor pagination with 16/16 passing gno tests and zero lint warnings.",
  );
  realm.approveAndSettle(
    { caller: sponsor.address },
    1,
    5,
    "Clean idiomatic Gno v1.8 code and thorough test coverage.",
  );

  // #2 -> Submitted (awaiting sponsor review or ExpireSubmission timeout)
  realm.claimBounty(
    { caller: builder.address },
    2,
    "Writing adversarial interrealm crossing tests and per-donor custody checks.",
  );
  realm.submitProof(
    { caller: builder.address },
    2,
    "https://github.com/hearthbounty/audit-suite/pull/4",
    "sha256:35521353280362463ce812e1faccc666447e578485b32ded62a63a5fe0687252",
    "Added adversarial tests verifying H-1 per-donor refunds, M-1 timeout expiry, and M-2 Unicode tag defense.",
  );

  // #3 -> Claimed (in progress)
  realm.claimBounty(
    { caller: agent.address },
    3,
    "Building MCP SHA-256 verifier and wiring live Onyx integration checks.",
  );

  // #5 -> Crowd-funded top-up (+1.20 GNOT by ironforge-dev -> 4.80 sponsor + 1.20 external donor)
  realm.topUpBounty(
    { caller: builder.address, sentCoins: [{ denom: DENOM, amount: 1_200_000 }] },
    5,
  );

  return realm;
}
