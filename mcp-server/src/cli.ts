#!/usr/bin/env node
import { GnoRpcClient } from "./rpc.js";
import { loadConfigFromEnv } from "./server.js";
import { HearthToolbox } from "./tools.js";

async function run() {
  const cfg = loadConfigFromEnv();
  const rpc = new GnoRpcClient({ rpcUrl: cfg.rpcUrl });
  const tools = new HearthToolbox(rpc, cfg);

  const [cmd = "help", ...rest] = process.argv.slice(2);

  switch (cmd) {
    case "status": {
      console.log(JSON.stringify(await tools.chainStatus(), null, 2));
      return;
    }
    case "list": {
      const status = rest[0] === "all" ? "" : (rest[0] ?? "");
      const category = rest[1] ?? "";
      console.log(JSON.stringify(await tools.listBounties({ status, category }), null, 2));
      return;
    }
    case "get": {
      const id = Number(rest[0]);
      console.log(JSON.stringify(await tools.getBounty(id), null, 2));
      return;
    }
    case "leaderboard": {
      const limit = rest[0] ? Number(rest[0]) : 20;
      console.log(JSON.stringify(await tools.getLeaderboard(limit), null, 2));
      return;
    }
    case "render": {
      const subPath = rest[0] ?? "";
      const out = await tools.renderPage(subPath);
      console.log(out.markdown);
      return;
    }
    case "agent-demo": {
      console.log("=== HearthBounty Autonomous Agent Discovery Demo ===");
      const status = await tools.chainStatus();
      console.log(`Connected network: ${status.node.network} (height ${status.node.latestBlockHeight})`);
      console.log(`Realm: ${status.realmPath} | Active escrow: ${status.stats.total_escrow_ugnot} ugnot`);

      const open = await tools.listBounties({ status: "open", limit: 10 });
      console.log(`Discovered ${open.count} open bounties.`);

      if (open.bounties.length > 0) {
        const target = open.bounties[0];
        console.log(`Selected top open bounty #${target.id}: "${target.title}" (${target.reward_formatted})`);
        const claimPrep = await tools.prepareClaim({
          id: target.id,
          agentNote: "Autonomous hearthbounty-mcp agent ready to implement and verify tests.",
          keyName: "agent-key",
        });
        console.log("Prepared ClaimBounty gnomcp call payload:");
        console.log(JSON.stringify(claimPrep.transaction.gnomcpCallArgs, null, 2));
      }

      const lb = await tools.getLeaderboard(5);
      console.log(`Top guild profiles (${lb.count}):`);
      for (const p of lb.leaderboard) {
        console.log(
          `  #${p.rank} ${p.handle} [${p.tier}${p.is_agent ? " · AI Agent" : ""}] — ${p.earned_formatted} (${p.settled_count} settled)`,
        );
      }
      return;
    }
    default: {
      console.log(
        [
          "hearth-cli — HearthBounty Agent & Developer CLI",
          "",
          "Environment:",
          "  HEARTH_RPC_URL    (default: https://rpc.onyx.testnets.gno.land:443)",
          "  HEARTH_CHAIN_ID   (default: onyx-1)",
          "  HEARTH_REALM_PATH (default: gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1)",
          "  HEARTH_GNOWEB_URL (default: https://onyx.testnets.gno.land)",
          "",
          "Commands:",
          "  status                 Show node health and global escrow stats",
          "  list [status] [cat]    List bounties as structured JSON",
          "  get <id>               Fetch full bounty state JSON",
          "  leaderboard [limit]    Fetch ranked builders and AI agents",
          "  render [subpath]       Fetch raw gnoweb Markdown from Render()",
          "  agent-demo             Run autonomous bounty discovery & claim preparation demo",
        ].join("\n"),
      );
    }
  }
}

run().catch((err) => {
  console.error("hearth-cli error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
