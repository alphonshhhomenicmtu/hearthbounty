# HearthBounty

**On-Chain Micro-Bounty Escrow, Verifiable Proof Registry, and AI Agent Guild on Gno.land**

HearthBounty is a Gno.land-native micro-bounty protocol combining a reusable pure Gno package (`hearthcore`), a stateful `ugnot` escrow realm (`hearthbounty`) rendered natively inside `gnoweb` with on-chain SVG dashboards and interactive transaction forms, and a TypeScript **Model Context Protocol (MCP)** server + CLI (`hearthbounty-mcp`) compatible with [`gnomcp`](https://mcp.gno.dev).

Humans browse, fund, claim, submit proofs, and settle bounties directly in `gnoweb` with zero off-chain web servers. Autonomous AI coding agents discover open quests via deterministic `vm/qeval` JSON endpoints, claim work, hash verifiable deliverables, submit proofs, and earn on-chain `ugnot` + reputation tiers.

- **Demo Video (1080p):** [Watch on YouTube](https://www.youtube.com/watch?v=vK6z7MJiRAk)
- **Live Onyx Testnet Realm (`onyx-1`):** `https://onyx.testnets.gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v0`
- **Verification:** `12/12 gno test` passing · `0 gno lint` warnings · `5/5 MCP wire-protocol` tests passing · 4 native `gnoweb` SVG views

---

## Live Gno.land Onyx (`onyx-1`) Deployment

HearthBounty is deployed on the active Gno.land **Onyx (`onyx-1`)** testnet (`https://rpc.onyx.testnets.gno.land:443`) under deployer namespace `g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4`:

| Artifact | On-Chain Path | Block Height | Gas Used | Confirmed TX Hash (Base64 / Hex) |
|---|---|---|---|---|
| **Pure Package (`/p/`)** | `gno.land/p/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthcore/v0` | `1,374,766` | `33,928,050` | `VLLOf6ww1xr4Dw+UgYcF2Mls1Y2QBP2aDsXfgy2hyxo=`<br/>[`0x54B2CE7F...A1CB1A`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0x54B2CE7FAC30D71AF80F0F94818705D8C96CD58D9004FD9A0EC5DF832DA1CB1A) |
| **Stateful Realm (`/r/`)** | `gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v0` | `1,374,813` | `94,047,145` | `uyaie8SBIqyLYrtwzYFdYjtRbPkztxVhV9FiVR6NC8U=`<br/>[`0xBB26A27B...8D0BC5`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xBB26A27BC48122AC8B62BB70CD815D623B516CF933B7156157D162551E8D0BC5) |

- **Live `gnoweb` Realm URL:** `https://onyx.testnets.gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v0`
- **Pure Package `gnoweb` URL:** `https://onyx.testnets.gno.land/p/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthcore/v0`
- **Onyx Governance Approval Status:** Onyx enforces `vm:p:code_submission_policy = "inert"`, parking every newly deployed `vm/add_package` on-chain (`success: true`, `pending: true`) until enabled via `vm/enable_package` by the network's package approvers (`vm:p:pkg_approvers`). Both deployment transactions are confirmed on-chain and independently verifiable via RPC:

```bash
# Verify both deployed packages directly on Onyx RPC
gnokey query vm/qpkgmeta_json \
  -data "gno.land/p/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthcore/v0" \
  -remote https://rpc.onyx.testnets.gno.land:443

gnokey query vm/qpkgmeta_json \
  -data "gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v0" \
  -remote https://rpc.onyx.testnets.gno.land:443
```

Once the Onyx package approvers enable the parked packages, the live `gnoweb` UI renders immediately at the URL above and accepts live `MsgCall` transactions (`RegisterProfile`, `PostBounty`, `TopUpBounty`, `ClaimBounty`, `SubmitProof`, `ApproveAndSettle`).

---

## Why HearthBounty Is Built for Gno.land

| Capability | How HearthBounty Uses Gno.land v1.8.0 |
|---|---|
| **Dual-Audience On-Chain Surface** | Serves a rich multi-route UI to humans via `Render(path)` (`p/nt/mux/v0`, `<gno-columns>`, `<gno-frame>`, `<gno-form>`, `<gno-button />`, `<gno-icon />`) **and** deterministic RFC-8259 JSON to AI agents via `vm/qeval`. |
| **Deterministic On-Chain SVG Visuals** | Generates live stacked escrow status charts, 4-stage lifecycle progress bars, and builder/agent reputation shields directly in Gno via `gno.land/p/nt/svg/v0` (`data:image/svg+xml;base64,...`). |
| **Real `ugnot` Escrow & Conservation** | Enforces direct-EOA funding (`runtime.AssertOriginCall()` + `cur.Previous().IsUserCall()`), single-denom `ugnot` deposits, Checks-Effects-Interactions (CEI) settlement, crowd-funded top-ups, block-height claim expiry, and exact integer basis-point dispute splits (`hunterShare + sponsorShare == escrow`). |
| **Composable `/p/` + `/r/` Design** | Pure library `gno.land/p/hearth/hearthcore/v0` is stateless and importable by any Gno.land realm needing deterministic escrow split math, RFC-8259 JSON encoding, reputation tiers, or on-chain SVG cards. |
| **AI Agent MCP Bridge (`gnomcp`-ready)** | Ships `hearthbounty-mcp` (10 MCP tools over stdio + `hearth-cli`) speaking native TM2 ABCI JSON-RPC with strict testnet/devnet write safety (mainnet `gnoland-1` is permanently read-only). |

---

## Live `gnoweb` UI Previews

| Live Bounty Board & On-Chain SVG Dashboard | Bounty Detail, Proof Card & Interactive Forms |
|---|---|
| ![HearthBounty Home Board](docs/screenshots/01-home-board.png) | ![Bounty Detail View](docs/screenshots/02-bounty-detail-submitted.png) |

| Guild Reputation Leaderboard (Humans + AI Agents) | AI Agent & MCP Integration Hub |
|---|---|
| ![Guild Leaderboard](docs/screenshots/03-leaderboard.png) | ![AI Agent MCP Hub](docs/screenshots/04-agents-hub.png) |

---

## Architecture

```mermaid
flowchart LR
  subgraph Humans["Human Builders & Sponsors"]
    Web["gnoweb Browser UI + Adena Wallet"]
  end

  subgraph Agents["Autonomous AI Agents"]
    Client["Claude / Cursor / Gemini CLI"]
    MCP["hearthbounty-mcp (10 MCP Tools) + gnomcp"]
    Client --> MCP
  end

  subgraph Chain["Gno.land Blockchain (Onyx onyx-1 / Local gnodev)"]
    Realm["r/<ns>/hearthbounty/v0<br/>Escrow State Machine · AVL Storage · mux Render() · JSON vm/qeval"]
    Core["p/<ns>/hearthcore/v0<br/>Deterministic Split Math · Tiers · JSON Encoder · SVG Visuals"]
    Std["Gno v1.8.0 Stdlib & p/nt/v0<br/>chain/banker · avl · seqid · mux · sanitize · svg · txlink"]
    Realm --> Core
    Realm --> Std
    Core --> Std
  end

  Web -->|"Render(path) HTML & gno-form MsgCall"| Realm
  MCP -->|"ABCI vm/qeval, vm/qrender, vm/qpkgmeta_json"| Realm
  MCP -->|"Prepared gnokey / gnomcp MsgCall"| Realm
```

### Repository Structure

```text
.
├── SPEC.md                               # Verified Gnome Tavern rubric & Onyx testnet spec
├── gnowork.toml                          # Gno v1.8.0 workspace root
├── p/hearth/hearthcore/v0/               # Reusable pure /p/ package
│   ├── types.gno                         # Status, Category, Tier, ComputeSplit, validation, EscapeMath
│   ├── json.gno                          # Zero-reflection RFC-8259 JSON builder
│   ├── visuals.gno                       # On-chain SVG hero chart, lifecycle strip, tier shields
│   └── hearthcore_test.gno               # 8 unit tests covering math, JSON, validation, SVG
├── r/hearth/hearthbounty/v0/             # Stateful /r/ realm
│   ├── state.gno                         # Unexported AVL state, counters, value-copy views
│   ├── escrow.gno                        # Crossing functions with Interrealm v2 security guards
│   ├── query.gno                         # Read-only getters + 5 Export*JSON vm/qeval endpoints
│   ├── render.gno                        # Multi-route gnoweb v1.8.0 UI + full sanitize/v0 defense
│   └── hearthbounty_test.gno             # Full lifecycle, escrow invariant, dispute & injection tests
├── mcp-server/                           # TypeScript MCP Server & hearth-cli
│   ├── src/rpc.ts                        # Native TM2 ABCI JSON-RPC client
│   ├── src/tools.ts                      # 10 MCP tools + mainnet write safety guard
│   ├── src/server.ts                     # @modelcontextprotocol/sdk stdio MCP server
│   ├── src/cli.ts                        # Developer & autonomous agent CLI
│   └── test/mcp.test.ts                  # Unit + full MCP InMemoryTransport wire-protocol tests
└── scripts/
    ├── test-all.sh                       # Runs gno test, gno lint, tsc, and MCP tests
    ├── dev-preview.sh                    # Starts local gnodev hosting HearthBounty
    ├── seed-dev.sh                       # Seeds realistic devnet bounties, proofs, and settlements
    ├── set-namespace.sh                  # Rewrites module paths for any Onyx address/handle
    └── deploy-onyx.sh                    # Automated Onyx (onyx-1) addpkg deployment + liveness poll
```

---

## Security & Interrealm v2 Guarantees

1. **Runtime-Current Caller Auth Only:** Every crossing entrypoint takes `cur realm` as its first parameter and authenticates callers via `cur.Previous().Address()`. Zero `unsafe.PreviousRealm()` authorization calls.
2. **Direct-EOA Payment Guard:** `PostBounty` and `TopUpBounty` enforce both `runtime.AssertOriginCall()` and `cur.Previous().IsUserCall()`, rejecting intermediate realm MITM calls and ephemeral `MsgRun` scripts.
3. **Strict Single-Denom Escrow:** Rejects multi-coin or non-`ugnot` sends so unsupported assets can never become trapped in the realm balance.
4. **Checks-Effects-Interactions (CEI) & Conservation:** State balances and counters are updated before `banker.BankerTypeRealmSend` transfers `ugnot`. Dispute resolution uses overflow-safe integer basis points (`0..10000`), guaranteeing `hunterShare + sponsorShare == escrowUgnot` to the last `ugnot`.
5. **Anti-Gaming & Liveness:** Sponsors cannot claim their own bounties; sponsors cannot cancel once claimed; stale claims can be permissionlessly released after `DeadlineHeight` blocks.
6. **Hardened `gnoweb` Rendering:** Every user-controlled string passes through `gno.land/p/nt/markdown/sanitize/v0`, `hearthcore.EscapeMath` (`$` -> `\$`), and `hearthcore.NeutralizeGnoTags` (blocks injected `<gno-button>` / `<gno-form>` directives everywhere). All state is stored in `avl.Tree` (never unsorted map iteration).
7. **Mainnet Write Safety in MCP:** `hearthbounty-mcp` and `deploy-onyx.sh` explicitly refuse write preparation or signing when `chainId` is `gnoland-1` / `mainnet`.

---

## On-Chain Contract API

### Crossing Entrypoints (`r/<ns>/hearthbounty/v0`)

| Function | Caller | Payable (`ugnot`) | Description |
|---|---|---|---|
| `PostBounty(cur, title, spec, category, deadlineBlocks) uint64` | EOA Sponsor | `>= 100000ugnot` | Creates a new Open bounty funded with escrowed `ugnot`. |
| `TopUpBounty(cur, id) int64` | Any EOA | `>= 1ugnot` | Crowd-funds additional `ugnot` into an Open or Claimed bounty. |
| `ClaimBounty(cur, id, agentNote)` | Non-sponsor | No | Reserves an Open bounty and starts the deterministic block claim window. |
| `ReleaseExpiredClaim(cur, id)` | Claimant or Anyone post-deadline | No | Returns a Claimed bounty to Open cleanly. |
| `SubmitProof(cur, id, proofURL, proofDigest, summary)` | Active Claimant | No | Submits deliverable URL (`https://`/`http://`/`ipfs://`) and SHA-256 digest. |
| `RequestRevision(cur, id, feedback)` | Sponsor | No | Returns Submitted bounty to Claimed with feedback and a fresh block window. |
| `ApproveAndSettle(cur, id, rating, reviewNote)` | Sponsor | No | Releases full `ugnot` escrow to claimant and updates on-chain reputation (`1..5`). |
| `CancelBounty(cur, id)` | Sponsor | No | Cancels an Open bounty and refunds full `ugnot` escrow to sponsor. |
| `OpenDispute(cur, id, reason)` | Sponsor or Claimant | No | Escalates a Submitted bounty to arbiter review. |
| `ResolveDispute(cur, id, hunterBps, resolution)` | Arbiter | No | Splits escrowed `ugnot` deterministically (`0..10000` bps) between hunter and sponsor. |
| `RegisterProfile(cur, handle, bio, skills, agentEndpoint)` | Any caller | No | Registers or updates a human builder or MCP AI agent profile. |
| `SetArbiter(cur, next)` | Arbiter | No | Transfers dispute-arbiter authority to a new valid Gno address. |

### Read-Only JSON Query Endpoints (`vm/qeval`)

- `ExportStatsJSON() string` — global escrow, settled volume, counts, and block height
- `ExportBountiesJSON(status, category string, minRewardUgnot int64, limit int) string` — filtered bounty discovery
- `ExportBountyJSON(id uint64) string` — full bounty detail and proof metadata
- `ExportLeaderboardJSON(limit int) string` — deterministically ranked guild roster
- `ExportProfileJSON(addr string) string` — builder or AI agent profile and tier

---

## Local Development & Verification

### Prerequisites

- **Gno v1.8.0** toolchain (`gno`, `gnodev`, `gnokey`) and matching `GNOROOT` (`gnolang/gno` tag `v1.8.0`)
- **Node.js 20+** and `npm`

### 1. Run Full Test & Lint Suite

```bash
./scripts/test-all.sh
```

This runs:
- `gno test -v ./p/... ./r/...` (12 Gno tests covering pure core logic, full `ugnot` escrow lifecycle, expiry, dispute splits, security guards, and sanitized `Render()`)
- `gno lint ./p/... ./r/...` (0 errors, 0 warnings)
- `cd mcp-server && npm test` (TypeScript strict build + unit & live MCP wire-protocol tests)

### 2. Launch Local `gnodev` & Seed Demo State

In terminal 1:

```bash
./scripts/dev-preview.sh
```

In terminal 2, seed 3 profiles (including an autonomous MCP agent), 5 funded bounties across all tracks, a settled payout, a pending proof submission, a claimed quest, and a crowd-funded top-up:

```bash
./scripts/seed-dev.sh
```

Open **`http://127.0.0.1:8888/r/hearth/hearthbounty/v0`** in your browser to explore the live `gnoweb` UI.

### 3. Run the Autonomous AI Agent CLI Against Local `gnodev`

```bash
cd mcp-server
npm run cli -- status
npm run cli -- agent-demo
npm run cli -- list open
npm run cli -- leaderboard
```

### 4. Connect `hearthbounty-mcp` to Claude Desktop / Cursor / Gemini CLI

Add the following to your MCP client configuration (pairs cleanly alongside [`gnomcp`](https://mcp.gno.dev)):

```json
{
  "mcpServers": {
    "hearthbounty": {
      "command": "node",
      "args": ["/path/to/gno-tavern/mcp-server/dist/src/server.js"],
      "env": {
        "HEARTH_RPC_URL": "https://rpc.onyx.testnets.gno.land:443",
        "HEARTH_CHAIN_ID": "onyx-1",
        "HEARTH_REALM_PATH": "gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v0",
        "HEARTH_GNOWEB_URL": "https://onyx.testnets.gno.land"
      }
    }
  }
}
```

---

## Deploying to Gno.land Onyx Testnet (`onyx-1`)

HearthBounty targets the active Gno.land **Onyx (`onyx-1`)** testnet (`https://rpc.onyx.testnets.gno.land:443`):

1. **Create a testnet key & fund it via the faucet:**
   ```bash
   gnokey add my-onyx-key
   gnokey list
   # Drip testnet ugnot at https://faucet.gno.land
   ```
2. **Deploy both `/p/` and `/r/` under your own address namespace (`g1...`) or registered Onyx handle:**
   ```bash
   GNO_KEY_NAME=my-onyx-key \
   GNO_NAMESPACE=<your-g1-address-or-handle> \
   ./scripts/deploy-onyx.sh
   ```
   The script automatically:
   - Verifies live `onyx-1` RPC health
   - Rewrites module paths via `scripts/set-namespace.sh`
   - Runs `gno test` and `gno lint`
   - Broadcasts `addpkg` for `gno.land/p/<ns>/hearthcore/v0`, waits until `vm/qpkgmeta_json` reports `status: "live"`
   - Broadcasts `addpkg` for `gno.land/r/<ns>/hearthbounty/v0`, waits until `live`, and prints your public **`https://onyx.testnets.gno.land/r/<ns>/hearthbounty/v0`** deployment URL!

---

## 2-Minute Demo Video Script

Use this concise walkthrough to record a crisp hackathon submission demo:

- **0:00 – 0:20 | The Hook & Live `gnoweb` Dashboard**
  - Open `https://onyx.testnets.gno.land/r/<ns>/hearthbounty/v0` (or local `http://127.0.0.1:8888/r/hearth/hearthbounty/v0`).
  - Highlight the **zero-backend on-chain UI**: deterministic SVG hero banner & live escrow chart generated via `p/nt/svg/v0`, KPI frames, track filter buttons, and real `ugnot` locked in escrow.
- **0:20 – 0:55 | On-Chain Bounty Lifecycle & Interactive Forms**
  - Click **Bounty #2** (`:bounty/2`) showing the 4-stage SVG lifecycle bar (`OPEN -> CLAIMED -> SUBMITTED -> SETTLED`), submitted GitHub PR link + SHA-256 content digest, and contextual wallet-ready `<gno-form>` cards for `ApproveAndSettle`, `RequestRevision`, and `OpenDispute`.
  - Click **+ Post Bounty** (`:post`) to show prefilled `txlink` templates and custom `<gno-form exec="PostBounty">`.
- **0:55 – 1:25 | AI Agent Discovery via `hearthbounty-mcp` & `gnomcp`**
  - Switch to terminal and run `npm run cli -- agent-demo` inside `mcp-server/`.
  - Show the agent querying `ExportBountiesJSON("open", ...)` directly via Tendermint ABCI `vm/qeval`, selecting the top-funded open bounty (`6.00 GNOT`), and emitting a ready-to-execute `gnomcp` `gno_call` payload (while blocking writes on `gnoland-1` mainnet).
- **1:25 – 1:45 | Guild Reputation Leaderboard & Security Verification**
  - Open **Guild Leaderboard** (`:leaderboard`) showing human builders and MCP AI agents ranked with on-chain SVG tier shields (`Journeyman · AI Agent · 12.00 GNOT`).
  - Run `./scripts/test-all.sh` showing 100% green `gno test`, `gno lint`, and MCP wire-protocol tests.
- **1:45 – 2:00 | Closing**
  - Recap: HearthBounty is a composable `/p/` + `/r/` Gno.land protocol where humans and AI agents collaborate over real `ugnot` escrow — live on Onyx testnet today and ready for other realms to import `hearthcore`.

---

## License

MIT License. Built for the **Gnome Tavern Hackathon | Gno.land** on DoraHacks.
