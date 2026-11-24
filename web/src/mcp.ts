/**
 * Browser-side MCP emulator mirroring all 12 hearthbounty-mcp tools
 * (mirrors mcp-server/src/tools.ts and mcp-server/src/server.ts).
 * Clearly labeled as an in-browser emulator over the local simulator state;
 * real stdio MCP execution against live Onyx runs via mcp-server/.
 */

import {
  BountyCategory,
  computeSha256Digest,
  ESCROW_TOKEN_KEY,
  formatGNOT,
  HearthBountyRealm,
  MAX_ESCROW_UGNOT,
  MIN_REWARD_UGNOT,
  REALM_ESCROW_ADDRESS,
  REALM_PKG_PATH,
  VALID_CATEGORIES,
} from "./engine.js";
import { ONYX_GNOWEB_URL, ONYX_RPC_URL } from "./onyx.js";

export const DEFAULT_GAS_WANTED = 10_000_000;
export const DEFAULT_GAS_FEE = "10000ugnot";
export const WUGNOT_PKG_PATH = "gno.land/r/gnoland/wugnot";

export type McpToolName =
  | "hearth_chain_status"
  | "hearth_list_bounties"
  | "hearth_get_bounty"
  | "hearth_leaderboard"
  | "hearth_get_profile"
  | "hearth_render_page"
  | "hearth_prepare_post_bounty"
  | "hearth_prepare_claim"
  | "hearth_prepare_submit_proof"
  | "hearth_prepare_settle"
  | "hearth_prepare_expire_submission"
  | "hearth_prepare_expire_dispute";

export interface McpToolDefinition {
  name: McpToolName;
  mode: "read" | "write-prep";
  summary: string;
  defaultArgs: Record<string, unknown>;
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "hearth_chain_status",
    mode: "read",
    summary: "Inspect node status, realm metadata, and global 1:1 wugnot escrow statistics.",
    defaultArgs: {},
  },
  {
    name: "hearth_list_bounties",
    mode: "read",
    summary: "Discover bounties filtered by status, category, and minimum wugnot reward.",
    defaultArgs: { status: "open", category: "", minRewardUgnot: 0, limit: 10 },
  },
  {
    name: "hearth_get_bounty",
    mode: "read",
    summary: "Read spec, per-donor custody split, review/dispute timeouts, and proof digest for one bounty.",
    defaultArgs: { id: 5 },
  },
  {
    name: "hearth_leaderboard",
    mode: "read",
    summary: "Fetch deterministic on-chain reputation rankings for humans and AI agents.",
    defaultArgs: { limit: 10 },
  },
  {
    name: "hearth_get_profile",
    mode: "read",
    summary: "Read builder or AI agent profile, tier, skills, and verified earnings.",
    defaultArgs: { address: "g1us8428u2a5satrlxzagqqa5m6vmuze025anjlj" },
  },
  {
    name: "hearth_render_page",
    mode: "read",
    summary: "Fetch native gnoweb Markdown output from Render(path).",
    defaultArgs: { subPath: "" },
  },
  {
    name: "hearth_prepare_post_bounty",
    mode: "write-prep",
    summary: "Build 1:1 wugnot Deposit/Approve pre-steps + PostBounty payload (gnokey + gnomcp).",
    defaultArgs: {
      title: "Build Deterministic Merkle Verifier",
      spec: "Create a pure Gno Merkle inclusion verifier package with full unit tests and zero lint warnings.",
      category: "realm",
      rewardUgnot: 3_500_000,
      deadlineBlocks: 40_000,
      keyName: "sponsor-key",
    },
  },
  {
    name: "hearth_prepare_claim",
    mode: "write-prep",
    summary: "Verify a bounty is Open and emit ClaimBounty payloads for an AI agent or builder.",
    defaultArgs: {
      id: 5,
      agentNote: "Selected highest-funded open bounty via hearth_list_bounties; ETA 30 blocks.",
      keyName: "agent-key",
    },
  },
  {
    name: "hearth_prepare_submit_proof",
    mode: "write-prep",
    summary: "Enforce https:// proof URL, hash deliverable via SHA-256, and build SubmitProof tx.",
    defaultArgs: {
      id: 3,
      proofURL: "https://github.com/alphonshhhomenicmtu/hearthbounty/pull/12",
      proofContent: "hearthbounty-v21-verified-deliverable-artifact",
      summary: "Delivered SHA-256 verifier tool and confirmed all MCP protocol tests pass.",
      keyName: "agent-key",
    },
  },
  {
    name: "hearth_prepare_settle",
    mode: "write-prep",
    summary: "Verify submitted proof and build sponsor ApproveAndSettle escrow release payload.",
    defaultArgs: {
      id: 2,
      rating: 5,
      reviewNote: "All adversarial custody, timeout, and Unicode sanitizer tests verified.",
      keyName: "sponsor-key",
    },
  },
  {
    name: "hearth_prepare_expire_submission",
    mode: "write-prep",
    summary: "Build permissionless ExpireSubmission payload to auto-settle 100% after ReviewDeadlineHeight.",
    defaultArgs: {
      id: 2,
      keyName: "bystander-key",
    },
  },
  {
    name: "hearth_prepare_expire_dispute",
    mode: "write-prep",
    summary: "Build permissionless ExpireDispute payload for 50/50 fallback after DisputeDeadlineHeight.",
    defaultArgs: {
      id: 2,
      keyName: "bystander-key",
    },
  },
];

export interface McpExecutionResult {
  tool: McpToolName;
  chainId: string;
  ok: boolean;
  durationMs: number;
  rpcRequest: Record<string, unknown>;
  response?: unknown;
  error?: string;
}

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

function shellQuote(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

export function buildPreparedTx(
  chainId: string,
  func: string,
  args: string[],
  send?: string,
  subRoute = "",
  keyName = "<your-key>",
  pkgPathOverride?: string,
) {
  assertWritableChain(chainId);
  const targetPkg = pkgPathOverride ?? REALM_PKG_PATH;
  const rpcUrl = chainId === "dev" ? "http://127.0.0.1:26657" : ONYX_RPC_URL;
  const gnowebBase = chainId === "dev" ? "http://127.0.0.1:8888" : ONYX_GNOWEB_URL;
  const parts = [
    "gnokey maketx call",
    `-pkgpath ${shellQuote(targetPkg)}`,
    `-func ${shellQuote(func)}`,
    ...args.map((a) => `-args ${shellQuote(a)}`),
  ];
  if (send) parts.push(`-send ${shellQuote(send)}`);
  parts.push(
    `-gas-fee ${DEFAULT_GAS_FEE}`,
    `-gas-wanted ${DEFAULT_GAS_WANTED}`,
    `-chainid ${shellQuote(chainId)}`,
    `-remote ${shellQuote(rpcUrl)}`,
    "-broadcast",
    keyName,
  );
  const profile = chainId === "dev" ? "local" : "testnet";
  const pathPart = targetPkg.replace(/^[^/]+/, "");
  const gnowebUrl = subRoute ? `${gnowebBase}${pathPart}:${subRoute}` : `${gnowebBase}${pathPart}`;

  return {
    chainId,
    rpcUrl,
    pkgPath: targetPkg,
    func,
    args,
    ...(send ? { send } : {}),
    gasWanted: DEFAULT_GAS_WANTED,
    gasFee: DEFAULT_GAS_FEE,
    gnokeyCommand: parts.join(" "),
    gnomcpCallArgs: {
      profile,
      pkg_path: targetPkg,
      func,
      args,
      ...(send ? { send } : {}),
    },
    gnowebUrl,
  };
}

export async function executeMcpTool(
  realm: HearthBountyRealm,
  tool: McpToolName,
  args: Record<string, unknown>,
  chainId = "onyx-1",
): Promise<McpExecutionResult> {
  const started = Date.now();
  const rpcRequest = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 9000) + 1000,
    method: "tools/call",
    params: {
      name: tool,
      arguments: args,
    },
  };

  try {
    let response: unknown;
    switch (tool) {
      case "hearth_chain_status": {
        response = {
          mode: "in-browser-emulator",
          node: {
            network: chainId,
            latestBlockHeight: realm.chainHeight,
            catchingUp: false,
          },
          realmPath: REALM_PKG_PATH,
          packageStatus: "in-browser-emulator",
          gnowebUrl: `${ONYX_GNOWEB_URL}${REALM_PKG_PATH.replace(/^[^/]+/, "")}`,
          stats: JSON.parse(realm.exportStatsJSON()),
        };
        break;
      }
      case "hearth_list_bounties": {
        const raw = realm.exportBountiesJSON(
          String(args.status ?? ""),
          String(args.category ?? ""),
          Number(args.minRewardUgnot ?? 0),
          Number(args.limit ?? 25),
        );
        response = JSON.parse(raw);
        break;
      }
      case "hearth_get_bounty": {
        const id = Number(args.id ?? 0);
        if (!Number.isInteger(id) || id <= 0) {
          throw new Error("Bounty ID must be a positive integer.");
        }
        response = JSON.parse(realm.exportBountyJSON(id));
        break;
      }
      case "hearth_leaderboard": {
        response = JSON.parse(realm.exportLeaderboardJSON(Number(args.limit ?? 20)));
        break;
      }
      case "hearth_get_profile": {
        const addr = String(args.address ?? "").trim();
        if (!addr) throw new Error("Address is required.");
        response = JSON.parse(realm.exportProfileJSON(addr));
        break;
      }
      case "hearth_render_page": {
        const subPath = String(args.subPath ?? "");
        response = {
          realmPath: REALM_PKG_PATH,
          subPath,
          markdown: realm.renderMarkdown(subPath),
        };
        break;
      }
      case "hearth_prepare_post_bounty": {
        const title = String(args.title ?? "").trim();
        const spec = String(args.spec ?? "").trim();
        const category = String(args.category ?? "").trim().toLowerCase() as BountyCategory;
        const rewardUgnot = Number(args.rewardUgnot ?? 0);
        const deadlineBlocks = Number(args.deadlineBlocks ?? 50_000);
        if (title.length < 4 || title.length > 120) throw new Error("Title must be 4-120 characters.");
        if (spec.length < 10 || spec.length > 4000) throw new Error("Specification must be 10-4000 characters.");
        if (!VALID_CATEGORIES.includes(category)) {
          throw new Error(`Invalid category "${category}".`);
        }
        if (!Number.isInteger(rewardUgnot) || rewardUgnot < MIN_REWARD_UGNOT || rewardUgnot > MAX_ESCROW_UGNOT) {
          throw new Error(`rewardUgnot must be an integer between ${MIN_REWARD_UGNOT} (0.10 GNOT) and ${MAX_ESCROW_UGNOT}.`);
        }
        const keyName = String(args.keyName ?? "<your-key>");
        response = {
          rewardFormatted: formatGNOT(rewardUgnot),
          escrowToken: ESCROW_TOKEN_KEY,
          escrowSpender: REALM_ESCROW_ADDRESS,
          escrowPreSteps: [
            buildPreparedTx(chainId, "Deposit", [], `${rewardUgnot}ugnot`, "", keyName, WUGNOT_PKG_PATH),
            buildPreparedTx(
              chainId,
              "Approve",
              [REALM_ESCROW_ADDRESS, String(rewardUgnot)],
              undefined,
              "",
              keyName,
              WUGNOT_PKG_PATH,
            ),
          ],
          transaction: buildPreparedTx(
            chainId,
            "PostBounty",
            [title, spec, category, String(rewardUgnot), String(deadlineBlocks)],
            undefined,
            "post",
            keyName,
          ),
        };
        break;
      }
      case "hearth_prepare_claim": {
        const id = Number(args.id ?? 0);
        const bounty = realm.bounties.get(id);
        if (!bounty) throw new Error(`Bounty #${id} was not found in simulator state.`);
        if (bounty.status !== "open") {
          throw new Error(`Bounty #${id} is "${bounty.status}", not "open".`);
        }
        response = {
          bounty: {
            id: bounty.id,
            title: bounty.title,
            escrow_ugnot: bounty.escrowUgnot,
            reward_formatted: formatGNOT(bounty.escrowUgnot),
            deadline_blocks: bounty.deadlineBlocks,
          },
          transaction: buildPreparedTx(
            chainId,
            "ClaimBounty",
            [String(id), String(args.agentNote ?? "").trim()],
            undefined,
            `bounty/${id}`,
            String(args.keyName ?? "<your-key>"),
          ),
        };
        break;
      }
      case "hearth_prepare_submit_proof": {
        const id = Number(args.id ?? 0);
        const url = String(args.proofURL ?? "").trim();
        if (!url.startsWith("https://") || /\s/.test(url) || url.length < 12 || url.length > 300) {
          throw new Error("proofURL must be a valid https:// URL (12-300 chars, no whitespace).");
        }
        const rawDigest = String(args.proofDigest ?? "").trim();
        const rawContent = String(args.proofContent ?? "");
        const digest = rawDigest
          ? rawDigest
          : rawContent
            ? await computeSha256Digest(rawContent)
            : "";
        if (digest.length < 8) {
          throw new Error("Provide either proofDigest (>=8 chars) or proofContent to auto-hash via SHA-256.");
        }
        const summary = String(args.summary ?? "").trim();
        if (summary.length < 6) throw new Error("summary must be at least 6 characters.");
        const bounty = realm.bounties.get(id);
        if (!bounty) throw new Error(`Bounty #${id} was not found in simulator state.`);
        if (bounty.status !== "claimed") {
          throw new Error(`Bounty #${id} is "${bounty.status}", expected "claimed" before submitting proof.`);
        }
        response = {
          bountyId: bounty.id,
          claimant: bounty.claimant,
          computedDigest: digest,
          transaction: buildPreparedTx(
            chainId,
            "SubmitProof",
            [String(id), url, digest, summary],
            undefined,
            `bounty/${id}`,
            String(args.keyName ?? "<your-key>"),
          ),
        };
        break;
      }
      case "hearth_prepare_settle": {
        const id = Number(args.id ?? 0);
        const rating = Number(args.rating ?? 0);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          throw new Error("rating must be an integer between 1 and 5.");
        }
        const bounty = realm.bounties.get(id);
        if (!bounty) throw new Error(`Bounty #${id} was not found in simulator state.`);
        if (bounty.status !== "submitted") {
          throw new Error(`Bounty #${id} is "${bounty.status}", expected "submitted" before settling.`);
        }
        response = {
          bountyId: bounty.id,
          sponsor: bounty.sponsor,
          recipient: bounty.claimant,
          payoutUgnot: bounty.escrowUgnot,
          payoutFormatted: formatGNOT(bounty.escrowUgnot),
          proofURL: bounty.proofURL,
          proofDigest: bounty.proofDigest,
          transaction: buildPreparedTx(
            chainId,
            "ApproveAndSettle",
            [String(id), String(rating), String(args.reviewNote ?? "").trim()],
            undefined,
            `bounty/${id}`,
            String(args.keyName ?? "<your-key>"),
          ),
        };
        break;
      }
      case "hearth_prepare_expire_submission": {
        const id = Number(args.id ?? 0);
        const bounty = realm.bounties.get(id);
        if (!bounty) throw new Error(`Bounty #${id} was not found in simulator state.`);
        if (bounty.status !== "submitted") {
          throw new Error(`Bounty #${id} is "${bounty.status}", expected "submitted" for ExpireSubmission.`);
        }
        response = {
          bountyId: bounty.id,
          claimant: bounty.claimant,
          reviewDeadlineHeight: bounty.reviewDeadlineHeight,
          payoutUgnot: bounty.escrowUgnot,
          payoutFormatted: formatGNOT(bounty.escrowUgnot),
          transaction: buildPreparedTx(
            chainId,
            "ExpireSubmission",
            [String(id)],
            undefined,
            `bounty/${id}`,
            String(args.keyName ?? "<your-key>"),
          ),
        };
        break;
      }
      case "hearth_prepare_expire_dispute": {
        const id = Number(args.id ?? 0);
        const bounty = realm.bounties.get(id);
        if (!bounty) throw new Error(`Bounty #${id} was not found in simulator state.`);
        if (bounty.status !== "disputed") {
          throw new Error(`Bounty #${id} is "${bounty.status}", expected "disputed" for ExpireDispute.`);
        }
        response = {
          bountyId: bounty.id,
          disputeDeadlineHeight: bounty.disputeDeadlineHeight,
          escrowUgnot: bounty.escrowUgnot,
          fallbackSplitBps: 5000,
          transaction: buildPreparedTx(
            chainId,
            "ExpireDispute",
            [String(id)],
            undefined,
            `bounty/${id}`,
            String(args.keyName ?? "<your-key>"),
          ),
        };
        break;
      }
    }

    return {
      tool,
      chainId,
      ok: true,
      durationMs: Date.now() - started,
      rpcRequest,
      response,
    };
  } catch (err) {
    return {
      tool,
      chainId,
      ok: false,
      durationMs: Date.now() - started,
      rpcRequest,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
