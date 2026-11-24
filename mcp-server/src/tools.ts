import { createHash } from "node:crypto";
import { GnoRpcClient, quoteGnoExprString } from "./rpc.js";

export const VALID_CATEGORIES = ["realm", "tool", "audit", "docs", "agent"] as const;
export type BountyCategory = (typeof VALID_CATEGORIES)[number];

export const VALID_STATUSES = [
  "open",
  "claimed",
  "submitted",
  "disputed",
  "settled",
  "cancelled",
] as const;
export type BountyStatus = (typeof VALID_STATUSES)[number];

export const MIN_REWARD_UGNOT = 100_000;
export const DEFAULT_GAS_WANTED = 10_000_000;
export const DEFAULT_GAS_FEE = "10000ugnot";

export interface HearthConfig {
  rpcUrl: string;
  chainId: string;
  realmPath: string;
  gnowebBaseUrl: string;
}

export interface BoardStats {
  realm_path: string;
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

export interface BountyItem {
  found?: boolean;
  id: number;
  title: string;
  spec: string;
  category: BountyCategory;
  status: BountyStatus;
  sponsor: string;
  claimant: string;
  claim_note: string;
  escrow_ugnot: number;
  initial_ugnot: number;
  payout_ugnot: number;
  refund_ugnot: number;
  reward_formatted: string;
  top_up_count: number;
  deadline_blocks: number;
  created_height: number;
  claimed_height: number;
  deadline_height: number;
  submitted_height: number;
  settled_height: number;
  proof_url: string;
  proof_digest: string;
  proof_summary: string;
  submission_count: number;
  revision_feedback: string;
  rating: number;
  review_note: string;
  dispute_reason: string;
  dispute_opened_by: string;
}

export interface ProfileItem {
  found?: boolean;
  rank?: number;
  address: string;
  handle: string;
  bio: string;
  skills: string;
  agent_endpoint: string;
  is_agent: boolean;
  tier: string;
  posted_count: number;
  claimed_count: number;
  settled_count: number;
  sponsored_settled: number;
  earned_ugnot: number;
  earned_formatted: string;
  sponsored_ugnot: number;
  rating_formatted: string;
  rating_sum: number;
  rating_count: number;
}

export interface PreparedTransaction {
  chainId: string;
  rpcUrl: string;
  pkgPath: string;
  func: string;
  args: string[];
  send?: string;
  gasWanted: number;
  gasFee: string;
  gnokeyCommand: string;
  gnomcpCallArgs: {
    profile: string;
    pkg_path: string;
    func: string;
    args: string[];
    send?: string;
  };
  gnowebUrl: string;
}

/**
 * Enforces gnomcp's safety invariant: write transactions are permitted ONLY on
 * local `dev` or testnet (`onyx-1` / `test*`) chains, never on `gnoland-1` mainnet.
 */
export function assertWritableChain(chainId: string): void {
  const norm = chainId.trim().toLowerCase();
  if (norm === "gnoland-1" || norm === "mainnet") {
    throw new Error("Safety block: write preparation/signing is disabled for gnoland-1 mainnet.");
  }
  const allowed = norm === "dev" || norm === "onyx-1" || norm.startsWith("test");
  if (!allowed) {
    throw new Error(
      `Safety block: chainId "${chainId}" is not recognized as a writable dev/testnet chain (expected "dev" or "onyx-1").`,
    );
  }
}

export function computeProofDigest(content: string): string {
  const hash = createHash("sha256").update(content, "utf8").digest("hex");
  return `sha256:${hash}`;
}

export function shellQuote(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

export function formatUgnotAsGnot(ugnot: number): string {
  const whole = Math.floor(ugnot / 1_000_000);
  const frac = Math.abs(ugnot % 1_000_000)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  const paddedFrac = frac.length < 2 ? frac.padEnd(2, "0") : frac;
  return `${whole}.${paddedFrac} GNOT`;
}

export function buildPreparedTx(
  cfg: HearthConfig,
  func: string,
  args: string[],
  send?: string,
  subRoute = "",
  keyPlaceholder = "<your-key>",
): PreparedTransaction {
  assertWritableChain(cfg.chainId);
  const parts = [
    "gnokey maketx call",
    `-pkgpath ${shellQuote(cfg.realmPath)}`,
    `-func ${shellQuote(func)}`,
    ...args.map((a) => `-args ${shellQuote(a)}`),
  ];
  if (send) {
    parts.push(`-send ${shellQuote(send)}`);
  }
  parts.push(
    `-gas-fee ${DEFAULT_GAS_FEE}`,
    `-gas-wanted ${DEFAULT_GAS_WANTED}`,
    `-chainid ${shellQuote(cfg.chainId)}`,
    `-remote ${shellQuote(cfg.rpcUrl)}`,
    "-broadcast",
    keyPlaceholder,
  );

  const profile = cfg.chainId === "dev" ? "local" : "testnet";
  const pathPart = cfg.realmPath.replace(/^[^/]+/, "");
  const gnowebUrl = subRoute
    ? `${cfg.gnowebBaseUrl.replace(/\/+$/, "")}${pathPart}:${subRoute}`
    : `${cfg.gnowebBaseUrl.replace(/\/+$/, "")}${pathPart}`;

  return {
    chainId: cfg.chainId,
    rpcUrl: cfg.rpcUrl,
    pkgPath: cfg.realmPath,
    func,
    args,
    ...(send ? { send } : {}),
    gasWanted: DEFAULT_GAS_WANTED,
    gasFee: DEFAULT_GAS_FEE,
    gnokeyCommand: parts.join(" "),
    gnomcpCallArgs: {
      profile,
      pkg_path: cfg.realmPath,
      func,
      args,
      ...(send ? { send } : {}),
    },
    gnowebUrl,
  };
}

export class HearthToolbox {
  constructor(
    private readonly rpc: GnoRpcClient,
    private readonly config: HearthConfig,
  ) {}

  async chainStatus() {
    const [node, pkgMeta, stats] = await Promise.all([
      this.rpc.getStatus(),
      this.rpc.queryPackageMeta(this.config.realmPath),
      this.rpc.queryEvalJSON<BoardStats>(this.config.realmPath, "ExportStatsJSON()"),
    ]);

    return {
      node,
      realmPath: this.config.realmPath,
      packageStatus: pkgMeta.status,
      gnowebUrl: `${this.config.gnowebBaseUrl.replace(/\/+$/, "")}${this.config.realmPath.replace(/^[^/]+/, "")}`,
      stats,
    };
  }

  async listBounties(params: {
    status?: string;
    category?: string;
    minRewardUgnot?: number;
    limit?: number;
  }) {
    const status = params.status?.trim().toLowerCase() ?? "";
    const category = params.category?.trim().toLowerCase() ?? "";
    const minReward = Math.max(0, Math.floor(params.minRewardUgnot ?? 0));
    const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 25)));

    const expr = `ExportBountiesJSON(${quoteGnoExprString(status)}, ${quoteGnoExprString(category)}, ${minReward}, ${limit})`;
    return this.rpc.queryEvalJSON<{
      chain_height: number;
      count: number;
      bounties: BountyItem[];
    }>(this.config.realmPath, expr);
  }

  async getBounty(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Bounty ID must be a positive integer.");
    }
    return this.rpc.queryEvalJSON<BountyItem>(this.config.realmPath, `ExportBountyJSON(${id})`);
  }

  async getLeaderboard(limit = 20) {
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    return this.rpc.queryEvalJSON<{
      count: number;
      leaderboard: ProfileItem[];
    }>(this.config.realmPath, `ExportLeaderboardJSON(${safeLimit})`);
  }

  async getProfile(address: string) {
    const addr = address.trim();
    if (!addr) {
      throw new Error("Address is required.");
    }
    return this.rpc.queryEvalJSON<ProfileItem>(
      this.config.realmPath,
      `ExportProfileJSON(${quoteGnoExprString(addr)})`,
    );
  }

  async renderPage(subPath = "") {
    const markdown = await this.rpc.queryRender(this.config.realmPath, subPath);
    return {
      realmPath: this.config.realmPath,
      subPath,
      markdown,
    };
  }

  preparePostBounty(params: {
    title: string;
    spec: string;
    category: BountyCategory;
    rewardUgnot: number;
    deadlineBlocks?: number;
    keyName?: string;
  }) {
    const title = params.title.trim();
    const spec = params.spec.trim();
    if (title.length < 4 || title.length > 120) {
      throw new Error("Title must be 4-120 characters.");
    }
    if (spec.length < 10 || spec.length > 4000) {
      throw new Error("Specification must be 10-4000 characters.");
    }
    if (!VALID_CATEGORIES.includes(params.category)) {
      throw new Error(`Invalid category "${params.category}". Expected one of: ${VALID_CATEGORIES.join(", ")}`);
    }
    if (!Number.isInteger(params.rewardUgnot) || params.rewardUgnot < MIN_REWARD_UGNOT) {
      throw new Error(`rewardUgnot must be an integer >= ${MIN_REWARD_UGNOT} (0.10 GNOT).`);
    }
    const deadlineBlocks = params.deadlineBlocks ?? 50_000;
    if (!Number.isInteger(deadlineBlocks) || deadlineBlocks < 10 || deadlineBlocks > 2_000_000) {
      throw new Error("deadlineBlocks must be between 10 and 2,000,000.");
    }

    return {
      rewardFormatted: formatUgnotAsGnot(params.rewardUgnot),
      transaction: buildPreparedTx(
        this.config,
        "PostBounty",
        [title, spec, params.category, String(deadlineBlocks)],
        `${params.rewardUgnot}ugnot`,
        "post",
        params.keyName ?? "<your-key>",
      ),
    };
  }

  async prepareClaim(params: { id: number; agentNote: string; keyName?: string }) {
    const bounty = await this.getBounty(params.id);
    if (!bounty.found) {
      throw new Error(`Bounty #${params.id} was not found on-chain.`);
    }
    if (bounty.status !== "open") {
      throw new Error(`Bounty #${params.id} is "${bounty.status}", not "open".`);
    }

    return {
      bounty: {
        id: bounty.id,
        title: bounty.title,
        escrow_ugnot: bounty.escrow_ugnot,
        reward_formatted: bounty.reward_formatted,
        deadline_blocks: bounty.deadline_blocks,
      },
      transaction: buildPreparedTx(
        this.config,
        "ClaimBounty",
        [String(params.id), params.agentNote.trim()],
        undefined,
        `bounty/${params.id}`,
        params.keyName ?? "<your-key>",
      ),
    };
  }

  async prepareSubmitProof(params: {
    id: number;
    proofURL: string;
    proofDigest?: string;
    proofContent?: string;
    summary: string;
    keyName?: string;
  }) {
    const url = params.proofURL.trim();
    if (!url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("ipfs://")) {
      throw new Error("proofURL must start with https://, http://, or ipfs://");
    }
    const digest = params.proofDigest?.trim()
      ? params.proofDigest.trim()
      : params.proofContent
        ? computeProofDigest(params.proofContent)
        : "";
    if (digest.length < 8) {
      throw new Error("Provide either proofDigest (>=8 chars) or proofContent to auto-hash via SHA-256.");
    }
    const summary = params.summary.trim();
    if (summary.length < 6) {
      throw new Error("summary must be at least 6 characters.");
    }

    const bounty = await this.getBounty(params.id);
    if (!bounty.found) {
      throw new Error(`Bounty #${params.id} was not found on-chain.`);
    }
    if (bounty.status !== "claimed") {
      throw new Error(`Bounty #${params.id} is "${bounty.status}", expected "claimed" before submitting proof.`);
    }

    return {
      bountyId: bounty.id,
      claimant: bounty.claimant,
      computedDigest: digest,
      transaction: buildPreparedTx(
        this.config,
        "SubmitProof",
        [String(params.id), url, digest, summary],
        undefined,
        `bounty/${params.id}`,
        params.keyName ?? "<your-key>",
      ),
    };
  }

  async prepareSettle(params: {
    id: number;
    rating: number;
    reviewNote: string;
    keyName?: string;
  }) {
    if (!Number.isInteger(params.rating) || params.rating < 1 || params.rating > 5) {
      throw new Error("rating must be an integer between 1 and 5.");
    }
    const bounty = await this.getBounty(params.id);
    if (!bounty.found) {
      throw new Error(`Bounty #${params.id} was not found on-chain.`);
    }
    if (bounty.status !== "submitted") {
      throw new Error(`Bounty #${params.id} is "${bounty.status}", expected "submitted" before settling.`);
    }

    return {
      bountyId: bounty.id,
      sponsor: bounty.sponsor,
      recipient: bounty.claimant,
      payoutUgnot: bounty.escrow_ugnot,
      payoutFormatted: formatUgnotAsGnot(bounty.escrow_ugnot),
      proofURL: bounty.proof_url,
      proofDigest: bounty.proof_digest,
      transaction: buildPreparedTx(
        this.config,
        "ApproveAndSettle",
        [String(params.id), String(params.rating), params.reviewNote.trim()],
        undefined,
        `bounty/${params.id}`,
        params.keyName ?? "<your-key>",
      ),
    };
  }
}
