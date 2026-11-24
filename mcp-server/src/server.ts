#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GnoRpcClient } from "./rpc.js";
import { DEFAULT_V1_REALM_ADDRESS, HearthConfig, HearthToolbox, VALID_CATEGORIES } from "./tools.js";

export function loadConfigFromEnv(): HearthConfig {
  const rpcUrl = process.env.HEARTH_RPC_URL ?? "https://rpc.onyx.testnets.gno.land:443";
  const chainId = process.env.HEARTH_CHAIN_ID ?? "onyx-1";
  const realmPath =
    process.env.HEARTH_REALM_PATH ??
    "gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1";
  const gnowebBaseUrl = process.env.HEARTH_GNOWEB_URL ?? "https://onyx.testnets.gno.land";
  const escrowRealmAddress = process.env.HEARTH_ESCROW_ADDRESS ?? DEFAULT_V1_REALM_ADDRESS;
  return { rpcUrl, chainId, realmPath, gnowebBaseUrl, escrowRealmAddress };
}

export function createHearthMcpServer(config: HearthConfig = loadConfigFromEnv()): McpServer {
  const rpc = new GnoRpcClient({ rpcUrl: config.rpcUrl });
  const toolbox = new HearthToolbox(rpc, config);

  const server = new McpServer({
    name: "hearthbounty-mcp",
    version: "1.1.0",
  });

  const okJson = (data: unknown) => ({
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  });

  server.tool(
    "hearth_chain_status",
    "Inspect live Gno.land node status, HearthBounty v1 realm liveness, and global 1:1 wugnot escrow statistics.",
    {},
    async () => okJson(await toolbox.chainStatus()),
  );

  server.tool(
    "hearth_list_bounties",
    "Discover on-chain micro-bounties filtered by status, category, and minimum wugnot reward.",
    {
      status: z.string().optional().describe("Optional status filter: open, claimed, submitted, disputed, settled, cancelled"),
      category: z.string().optional().describe("Optional category filter: realm, tool, audit, docs, agent"),
      minRewardUgnot: z.number().int().nonnegative().optional().describe("Minimum reward in wugnot (1:1 ugnot)"),
      limit: z.number().int().min(1).max(100).optional().describe("Maximum results (default 25)"),
    },
    async (args) => okJson(await toolbox.listBounties(args)),
  );

  server.tool(
    "hearth_get_bounty",
    "Inspect full specification, per-contributor custody split, review/dispute timeout heights, and proof digest for one bounty.",
    {
      id: z.number().int().positive().describe("Numeric bounty ID"),
    },
    async ({ id }) => okJson(await toolbox.getBounty(id)),
  );

  server.tool(
    "hearth_leaderboard",
    "Fetch the deterministic on-chain reputation leaderboard of human builders and autonomous AI agents.",
    {
      limit: z.number().int().min(1).max(100).optional().describe("Maximum entries (default 20)"),
    },
    async ({ limit }) => okJson(await toolbox.getLeaderboard(limit)),
  );

  server.tool(
    "hearth_get_profile",
    "Read a specific Gno address's HearthBounty v1 profile, tier, skills, agent endpoint, and verified track record.",
    {
      address: z.string().min(4).describe("Gno bech32 address (g1...)"),
    },
    async ({ address }) => okJson(await toolbox.getProfile(address)),
  );

  server.tool(
    "hearth_render_page",
    "Fetch the raw gnoweb Markdown output from HearthBounty v1's Render(path) function.",
    {
      subPath: z.string().optional().describe("Route suffix such as '', 'bounty/1', 'leaderboard', 'post', or 'agents'"),
    },
    async ({ subPath }) => {
      const page = await toolbox.renderPage(subPath ?? "");
      return { content: [{ type: "text" as const, text: page.markdown }] };
    },
  );

  server.tool(
    "hearth_prepare_post_bounty",
    "Validate and build wugnot Deposit/Approve pre-steps plus a PostBounty transaction (gnokey CLI + gnomcp call payload).",
    {
      title: z.string().min(4).max(120),
      spec: z.string().min(10).max(4000),
      category: z.enum(VALID_CATEGORIES),
      rewardUgnot: z.number().int().min(100_000).describe("Escrow amount in wugnot (1:1 ugnot, minimum 100000 = 0.10 GNOT)"),
      deadlineBlocks: z.number().int().min(10).max(2_000_000).optional(),
      keyName: z.string().optional(),
    },
    async (args) => okJson(toolbox.preparePostBounty(args)),
  );

  server.tool(
    "hearth_prepare_claim",
    "Verify a bounty is Open on-chain and prepare a ClaimBounty transaction for an agent or builder.",
    {
      id: z.number().int().positive(),
      agentNote: z.string().max(600).describe("Execution plan or agent capability note"),
      keyName: z.string().optional(),
    },
    async (args) => okJson(await toolbox.prepareClaim(args)),
  );

  server.tool(
    "hearth_prepare_submit_proof",
    "Verify claim ownership, enforce https:// deliverable links, optionally SHA-256 hash content, and prepare SubmitProof.",
    {
      id: z.number().int().positive(),
      proofURL: z.string().min(12).max(300).describe("HTTPS-only deliverable link (https://...)"),
      proofDigest: z.string().optional().describe("Precomputed digest (optional if proofContent is provided)"),
      proofContent: z.string().optional().describe("Raw artifact text to hash into sha256:<hex>"),
      summary: z.string().min(6).max(600),
      keyName: z.string().optional(),
    },
    async (args) => okJson(await toolbox.prepareSubmitProof(args)),
  );

  server.tool(
    "hearth_prepare_settle",
    "Verify submitted proof on-chain and prepare a sponsor ApproveAndSettle transaction releasing wugnot escrow.",
    {
      id: z.number().int().positive(),
      rating: z.number().int().min(1).max(5),
      reviewNote: z.string().max(600),
      keyName: z.string().optional(),
    },
    async (args) => okJson(await toolbox.prepareSettle(args)),
  );

  server.tool(
    "hearth_prepare_expire_submission",
    "Prepare a permissionless ExpireSubmission call settling 100% escrow to the claimant after ReviewDeadlineHeight.",
    {
      id: z.number().int().positive(),
      keyName: z.string().optional(),
    },
    async (args) => okJson(await toolbox.prepareExpireSubmission(args)),
  );

  server.tool(
    "hearth_prepare_expire_dispute",
    "Prepare a permissionless ExpireDispute call triggering the 50/50 fallback split after DisputeDeadlineHeight.",
    {
      id: z.number().int().positive(),
      keyName: z.string().optional(),
    },
    async (args) => okJson(await toolbox.prepareExpireDispute(args)),
  );

  return server;
}

async function main() {
  const server = createHearthMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const isEntrypoint =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("/server.js") || process.argv[1].endsWith("\\server.js"));

if (isEntrypoint) {
  main().catch((err) => {
    console.error("hearthbounty-mcp fatal error:", err);
    process.exit(1);
  });
}
