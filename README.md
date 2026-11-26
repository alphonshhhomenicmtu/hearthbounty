# HearthBounty

**On-Chain Micro-Bounty Escrow, Verifiable Proof Registry, and AI Agent Guild on Gno.land**

HearthBounty is a Gno.land v1.8.0 micro-bounty protocol composed of three on-chain modules plus a TypeScript MCP bridge:

1. **`hearthcore/v0` (`/p/`)** — Reusable pure Gno package providing overflow-safe integer basis-point splits (`ComputeSplit`), reputation tier evaluation (`ComputeTier`), zero-reflection RFC-8259 JSON encoding, and deterministic on-chain SVG visuals (`p/nt/svg/v0`).
2. **`hearthbounty/v1` (`/r/`)** — Hardened stateful escrow realm settling in official Genesis 1:1 `ugnot`-backed **`wugnot`** via non-crossing `gno.land/r/nt/grc20reg/v0` `RealmTeller` transfers (zero `chain/banker` and zero `chain/runtime/unsafe` imports across production code). Renders a paginated multi-route `gnoweb` UI (`p/nt/mux/v0`) and exposes 5 deterministic `vm/qeval` JSON query endpoints.
3. **`hearthguild/v0` (`/r/`)** — Composable companion consumer realm importing both `hearthcore/v0` and `hearthbounty/v1` to provide on-chain builder passports, peer skill endorsements, and DAO/grant eligibility gates (`CheckEligibility`).
4. **`hearthbounty-mcp`** — TypeScript Model Context Protocol (MCP) server (12 stdio tools + `hearth-cli`) speaking Tendermint ABCI JSON-RPC alongside [`gnomcp`](https://mcp.gno.dev), with permanent mainnet (`gnoland-1`) write blocking.

**Arbiter Trust Model & Liveness Guarantee:** Disputed submissions route to a rotatable arbiter (`SetArbiter`) who is prevented on-chain from resolving any bounty they are a party to (`caller == sponsor || caller == claimant`). If a sponsor ignores a submitted proof or the arbiter fails to act, permissionless `ExpireSubmission` (100% payout to claimant after `ReviewDeadlineHeight`) and `ExpireDispute` (50/50 pro-rata split after `DisputeDeadlineHeight`) prevent escrowed funds from ever freezing.

- **Interactive Web Playground, Adversarial Breaker Lab & Live Onyx Explorer:** [Launch Playground](https://alphonshhhomenicmtu.github.io/hearthbounty/) · [Breaker Lab](https://alphonshhhomenicmtu.github.io/hearthbounty/#/breaker) · [Run `/diag` Self-Test](https://alphonshhhomenicmtu.github.io/hearthbounty/#/diag)
- **10-Slide Pitch Deck (PDF):** [`docs/hearthbounty-deck.pdf`](docs/hearthbounty-deck.pdf) · [Direct PDF View](https://alphonshhhomenicmtu.github.io/hearthbounty/hearthbounty-deck.pdf)
- **Demo Video (1080p):** [Watch on YouTube](https://youtu.be/vK6z7MJiRAk)
- **Onyx Testnet (`onyx-1`) Live Deployments (`g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4`):**
  - **Hardened Escrow Realm (`hearthbounty/v1`):** `https://onyx.testnets.gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1`
  - **Companion Consumer Realm (`hearthguild/v0`):** `https://onyx.testnets.gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthguild/v0`
  - **Reusable Pure Package (`hearthcore/v0`):** `https://onyx.testnets.gno.land/p/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthcore/v0`
- **Verification:** `16/16 gno test` passing · `0 gno lint` warnings · `5/5 MCP wire-protocol` tests passing · `5/5 Web Playground & Breaker Lab` tests passing · automated browser `/diag` self-test suite

---

## V2.1 Security Audit Hardening & Onyx Live Architecture

Every finding from red-team review and live Onyx GPAO forensics was fixed and proven with regression tests:

| Finding | Root Cause in Legacy `v0` | Fix Enforced in `hearthbounty/v1` | Regression Test |
|---|---|---|---|
| **H-1 (High): Third-Party TopUp Theft** | `CancelBounty` refunded entire `EscrowUgnot` (including third-party top-ups) back to `b.Sponsor`, and allowed active claimants/donors to wash `EarnedUgnot` / `SponsoredUgnot`. | Per-contributor AVL `DonorShares` ledger tracks `SponsorFundedUgnot` separately from external donors (`MinTopUpUgnot = 100,000`, `MaxExternalDonors = 20`). `CancelBounty` refunds each contributor directly; dispute splits refund pro-rata; refunded `SponsoredUgnot` credits decrement; donor self-claim and claimant self-top-up abort. | `TestCancelRefundsThirdPartyDonorsWithoutSponsorTheft`, `TestClaimantCannotWashTopUpIntoEarned` |
| **M-1 (Medium): Unbounded Hostage Escrow & Conflicted Arbiter** | Submitted proofs had no review timeout, disputes had no expiry fallback, and an arbiter who was sponsor/claimant could self-settle. | Added `ReviewDeadlineHeight` + permissionless `ExpireSubmission` (100% claimant payout), `DisputeDeadlineHeight` + permissionless `ExpireDispute` (50/50 pro-rata split), and conflict guard rejecting `caller == b.Sponsor || caller == b.Claimant` in `ResolveDispute`. | `TestSubmissionReviewTimeoutAutoSettle`, `TestDisputeSplitConflictGuardAndTimeoutFallback` |
| **M-2 (Medium): Unicode Tag-Neutralizer Bypass** | `strings.ToLower` expands Turkish `'İ'` (`U+0130`) from 2 bytes to 3 bytes (`"i\u0307"`), shifting byte offsets so `İ<gno-form ...>` bypassed neutralization. | `NeutralizeGnoTags` in `sanitize.gno` performs direct byte-indexed ASCII case folding on the original string without `strings.ToLower`. `ValidateProofURL` restricts links strictly to `https://`. | `TestUnicodeNeutralizeGnoTagsAndSecurityGuards` |
| **Onyx `inert` Blocker (`chain/banker`)** | Automated Onyx GPAO (`g1yaee4f...`) holds realms importing `chain/banker` indefinitely in `status: "inert"` for manual review. | Switched escrow rail to official Genesis 1:1 `ugnot`-backed **`wugnot`** (`gno.land/r/gnoland/wugnot.wugnot`) via non-crossing `gno.land/r/nt/grc20reg/v0` `RealmTeller` transfers — zero `chain/banker` and zero `chain/runtime/unsafe` imports across all production code. | `gpao verify-one` exit 0 + live Onyx deployment |

---

## Live Gno.land Onyx (`onyx-1`) Deployments

Deployed on **Onyx (`onyx-1`)** (`https://rpc.onyx.testnets.gno.land:443`) under deployer namespace `g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4`:

| Artifact | On-Chain Path | Block Height | Gas Used | Onyx Status | Confirmed TX Hash (Hex) |
|---|---|---:|---:|---|---|
| **Pure Package (`/p/`)** | `gno.land/p/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthcore/v0` | `1,374,766` | `33,928,050` | **LIVE (`HTTP 200`)** | [`0x54B2CE7F...A1CB1A`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0x54B2CE7FAC30D71AF80F0F94818705D8C96CD58D9004FD9A0EC5DF832DA1CB1A) |
| **Hardened Escrow Realm (`/r/`)** | `gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1` | `1,378,958` | `126,117,131` | **LIVE (`HTTP 200`)** | [`0xEA7C4437...B52CFC`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xEA7C4437B635CC0DFA8295B9B1FD77D9113B012CA86E7E0A4E5259723CB52CFC) |
| **Companion Consumer Realm (`/r/`)** | `gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthguild/v0` | `1,378,960` | `17,437,231` | **LIVE (`HTTP 200`)** | [`0xBFF689BC...D4C75F`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xBFF689BC49A59AF56CC85A2C9FB0C7B0ED44F224286AA86916B375216BD4C75F) |
| *Legacy Prototype (Superseded)* | `gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v0` | `1,374,813` | `94,047,145` | Inert (`chain/banker`) | [`0xBB26A27B...8D0BC5`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xBB26A27BC48122AC8B62BB70CD815D623B516CF933B7156157D162551E8D0BC5) |

- **Derived `hearthbounty/v1` Escrow Spender Address (`wugnot.Approve` target):** `g1dkvpnfcp8saevy2g46x9z2ljyj9saez6akm39a`
- **Escrow Token Registry Key:** `gno.land/r/gnoland/wugnot.wugnot` (1:1 `ugnot`-backed Genesis wrapped GNOT)
- **Live On-Chain State Invariant (Block `#1,380,085+`):** `3` seeded bounties (`1` settled, `1` submitted awaiting review, `1` open for AI discovery), `2` profiles (`1` AI agent), **`6.00 GNOT` active escrow custody** (`EscrowBalance(realm) == 6,000,000`) + **`2.00 GNOT` settled to AI agent** (`EscrowBalance(g1ynlu...rrv8) == 2,000,000`).

### Confirmed Live Seeded Onyx Transactions (`onyx-1`)

| # | Action | Entrypoint | Block | Confirmed TX Hash (Hex) |
|---:|---|---|---:|---|
| 1 | Wrap `10.00 GNOT` into Genesis `wugnot` | `wugnot.Deposit` | `1,379,191` | [`0x102266AD...94D403`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0x102266AD74577A10CD9A4A7AF622D596FA37D77E54DAE1BE957FD0448594D403) |
| 2 | Approve `hearthbounty/v1` escrow spender (`10.00 wugnot`) | `wugnot.Approve` | `1,379,193` | [`0x85D97BB7...BC5A63`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0x85D97BB7F76B0DD6F3F6321AB8D1825B8E7310F427243EFE4A34EC972CBC5A63) |
| 3 | Register sponsor profile (`tavern-keeper`) | `RegisterProfile` | `1,380,051` | [`0xF89F4B56...0504CA`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xF89F4B56F4D0B269E8F925446A8D03D63D8EB7E53A0F18217180BD4BFD0504CA) |
| 4 | Register AI agent profile (`anvil-onyx-agent`) | `RegisterProfile` | `1,380,053` | [`0xAA36855F...D403E2`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xAA36855F276B94A086B3FCF3A7A51DE73CA96D54D590188B18271B8913D403E2) |
| 5 | Post Bounty #1 (`2.00 GNOT`, Core Realm track) | `PostBounty` | `1,380,073` | [`0xCCE5FF6B...E01085`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xCCE5FF6BD22AA0829F9C07CB1BE1F6F0492C18B0863327FFC3DDD1BB4FE01085) |
| 6 | Claim Bounty #1 (`anvil-onyx-agent`) | `ClaimBounty` | `1,380,075` | [`0x66AE74C7...F58E5D`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0x66AE74C793D1BD0D05E4A64B7EB5E6939B1F2A2A15039C67EBFA3C5AF8F58E5D) |
| 7 | Submit HTTPS GitHub proof + SHA-256 digest for Bounty #1 | `SubmitProof` | `1,380,077` | [`0xEE156C2C...DF7F39B`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xEE156C2C0A62AB613111A9A9A82E1DBA259977C8B754FD9F3C6CC221BDF7F39B) |
| 8 | Approve & Settle Bounty #1 (`2.00 GNOT` payout, `5/5`) | `ApproveAndSettle` | `1,380,079` | [`0xE9FC6F60...B0E965`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xE9FC6F60D756D81A660E0FD19DBF5425B0926290B10FC240ADB88F603EB0E965) |
| 9 | Post Bounty #2 (`3.50 GNOT`, Security Audit track) | `PostBounty` | `1,380,081` | [`0xCCCF3879...B2EF2C`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xCCCF3879482425A60A76407D374D85BEC2D410F5743D5678751217738AB2EF2C) |
| 10 | Claim Bounty #2 (`anvil-onyx-agent`) | `ClaimBounty` | `1,380,082` | [`0xB047F67D...D2D708`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0xB047F67DD93D75B7ACBC7AD3B9B9BBA6BEC02825CFAD10C0979E324AB3D2D708) |
| 11 | Submit Proof #2 (remains **Submitted** for live inspection) | `SubmitProof` | `1,380,084` | [`0x7B69C841...277CC4`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0x7B69C8415C8F9084E63630AF2BDBCC4BB01FC548B140A91C474EA12DAA277CC4) |
| 12 | Post Bounty #3 (`2.50 GNOT`, AI Agents track — **Open**) | `PostBounty` | `1,380,085` | [`0x0A08B7CC...BBE0D9`](https://rpc.onyx.testnets.gno.land:443/tx?hash=0x0A08B7CCFB78C527F71F7EFD04B1F64E7991A55218CC177CED4BB911CEBBE0D9) |

```bash
# Verify live package status directly on Onyx RPC
gnokey query vm/qpkgmeta_json \
  -data "gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1" \
  -remote https://rpc.onyx.testnets.gno.land:443

gnokey query vm/qpkgmeta_json \
  -data "gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthguild/v0" \
  -remote https://rpc.onyx.testnets.gno.land:443
```

---

## Interactive Web Playground & Adversarial Breaker Lab

The zero-install web playground hosted on GitHub Pages ([`https://alphonshhhomenicmtu.github.io/hearthbounty/`](https://alphonshhhomenicmtu.github.io/hearthbounty/)) lets judges verify every protocol mechanic in seconds:

- **Adversarial Breaker Lab (`#/breaker`):** 1-click runnable exploit simulations for **H-1 Third-Party TopUp Theft**, **M-2 Unicode `U+0130` (`'İ'`) Tag Injection** (live v0 vs v1 diff), **Cross-Realm MITM / `uatom` / Dust Guard**, and **M-1 Hostage Timeout & Conflicted Arbiter**.
- **Live Onyx Explorer (`#/onyx`):** Queries `https://rpc.onyx.testnets.gno.land:443` directly from the browser for block height, `vm/qpkgmeta_json`, confirmed deployment TX proofs, and live `ExportStatsJSON()` / `ExportBountiesJSON()` output.
- **Escrow Simulator (`#/`):** Mirrors all 14 `hearthbounty/v1` crossing entrypoints (`PostBounty`, `TopUpBounty`, `ClaimBounty`, `ReleaseExpiredClaim`, `SubmitProof`, `RequestRevision`, `ApproveAndSettle`, `ExpireSubmission`, `CancelBounty`, `OpenDispute`, `ResolveDispute`, `ExpireDispute`, `RegisterProfile`, `SetArbiter`) with live CEI balance invariant tracking.
- **MCP Emulator (In-Browser, `#/mcp`):** Exercises all 12 `hearthbounty-mcp` tools over simulated state and tests the `gnoland-1` mainnet write block, while documenting the exact CLI command to run the live stdio MCP server in `mcp-server/` against Onyx.
- **Automated `/diag` Self-Test (`#/diag`):** Runs 10 browser verification checks covering math conservation, H-1/M-1/M-2 regressions, MCP safety, and live Onyx RPC proofs.

---

## Native `gnoweb` UI Previews

| Bounty Board & On-Chain SVG Dashboard | Bounty Detail, Proof Card & Interactive Forms |
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
    MCP["hearthbounty-mcp (12 MCP Tools) + gnomcp"]
    Client --> MCP
  end

  subgraph Chain["Gno.land Blockchain (Onyx onyx-1 / Local gnodev)"]
    Guild["r/g1x582.../hearthguild/v0<br/>Builder Passports · Peer Endorsements · CheckEligibility()"]
    Realm["r/g1x582.../hearthbounty/v1<br/>1:1 wugnot Escrow · AVL DonorShares · Liveness Timeouts · Paginated mux Render()"]
    Core["p/g1x582.../hearthcore/v0<br/>Deterministic Split Math · Tiers · RFC-8259 JSON · SVG Visuals"]
    Reg["Genesis Live Realms & p/nt/v0<br/>r/nt/grc20reg/v0 (wugnot) · avl · seqid · mux · sanitize · svg"]
    Guild --> Realm
    Guild --> Core
    Realm --> Core
    Realm --> Reg
    Core --> Reg
  end

  Web -->|"Render(path) HTML & gno-form MsgCall"| Realm
  Web -->|"Render(path) Passport"| Guild
  MCP -->|"ABCI vm/qeval, vm/qrender, vm/qpkgmeta_json"| Realm
  MCP -->|"Prepared gnokey / gnomcp MsgCall"| Realm
```

### Repository Structure

```text
.
├── SPEC.md                                                            # Verified Gnome Tavern rubric & Onyx spec
├── gnowork.toml                                                       # Gno v1.8.0 workspace root
├── p/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthcore/v0/          # Reusable pure /p/ package
│   ├── types.gno                                                      # Status, Category, Tier, ComputeSplit, EscapeMath
│   ├── json.gno                                                       # Zero-reflection RFC-8259 JSON builder
│   ├── visuals.gno                                                    # On-chain SVG hero chart, lifecycle strip, tier shields
│   └── hearthcore_test.gno                                            # 8 unit tests
├── r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1/        # Hardened 1:1 wugnot escrow realm
│   ├── state.gno                                                      # Unexported AVL state, DonorShares, value-copy views
│   ├── escrow.gno                                                     # 14 crossing entrypoints (grc20reg, H-1, M-1)
│   ├── sanitize.gno                                                   # Byte-indexed ASCII NeutralizeGnoTags + HTTPS-only URL
│   ├── query.gno                                                      # Read-only getters + 5 Export*JSON vm/qeval endpoints
│   ├── render.gno                                                     # Paginated multi-route gnoweb UI + wugnot tx links
│   └── hearthbounty_test.gno                                          # 7 integration & adversarial security tests
├── r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthguild/v0/         # Companion consumer realm (import proof)
│   ├── hearthguild.gno                                                # Imports hearthcore/v0 + hearthbounty/v1
│   └── hearthguild_test.gno                                           # Consumer import & endorsement tests
├── mcp-server/                                                        # TypeScript MCP Server (12 tools) & hearth-cli
├── web/                                                               # Zero-install Playground, Breaker Lab & Onyx Explorer
├── docs/                                                              # 10-slide PDF pitch deck & gnoweb screenshots
└── scripts/                                                           # test-all.sh, deploy-onyx.sh, seed-dev.sh, build-deck.mjs
```

---

## On-Chain Contract API (`hearthbounty/v1`)

| Function | Caller | Funding / Token | Description |
|---|---|---|---|
| `PostBounty(cur, title, spec, category, rewardUgnot, deadlineBlocks) uint64` | Direct EOA | `>= 100,000` `wugnot` | Pulls pre-approved 1:1 `wugnot` via `grc20reg.TransferFrom` and opens a bounty. |
| `TopUpBounty(cur, id, amountUgnot) int64` | Non-claimant EOA | `>= 100,000` `wugnot` | Adds pre-approved `wugnot` and records per-donor custody in `DonorShares`. |
| `ClaimBounty(cur, id, agentNote)` | Non-sponsor, non-donor | None | Reserves an Open bounty and starts the deterministic block claim window. |
| `ReleaseExpiredClaim(cur, id)` | Claimant or Anyone at `>= DeadlineHeight` | None | Returns a Claimed bounty to Open, clears stale proofs, decrements `ClaimedCount`. |
| `SubmitProof(cur, id, proofURL, proofDigest, summary)` | Active Claimant | None | Pins HTTPS-only deliverable URL + SHA-256 digest and opens `ReviewDeadlineHeight`. |
| `RequestRevision(cur, id, feedback)` | Sponsor | None | Returns Submitted bounty to Claimed with feedback and a fresh block window. |
| `ApproveAndSettle(cur, id, rating, reviewNote)` | Sponsor | None | Releases full `wugnot` escrow to claimant via CEI and records a 1–5 rating. |
| `ExpireSubmission(cur, id)` | Anyone at `>= ReviewDeadlineHeight` | None | Permissionlessly settles 100% escrow to claimant if sponsor stalls. |
| `CancelBounty(cur, id)` | Sponsor (Open only) | None | Refunds sponsor strictly `SponsorFundedUgnot` and every external donor directly. |
| `OpenDispute(cur, id, reason)` | Sponsor or Claimant | None | Escalates a Submitted bounty to arbiter review with `DisputeDeadlineHeight`. |
| `ResolveDispute(cur, id, hunterBps, resolution)` | Non-party Arbiter | None | Splits escrow (`0..10000` bps) and refunds contributors pro-rata. |
| `ExpireDispute(cur, id)` | Anyone at `>= DisputeDeadlineHeight` | None | Permissionless 50/50 pro-rata fallback split if arbiter stalls or is conflicted. |
| `RegisterProfile(cur, handle, bio, skills, agentEndpoint)` | Any caller | None | Registers or updates a human builder or MCP AI agent profile. |
| `SetArbiter(cur, next)` | Arbiter | None | Transfers dispute-arbiter authority to a new valid Gno address. |

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
- `gno test -v ./p/... ./r/...` — **16/16 tests** (`8` `hearthcore/v0`, `7` `hearthbounty/v1`, `1` `hearthguild/v0`)
- `gno lint ./p/... ./r/...` — **0 errors, 0 warnings**
- `cd mcp-server && npm test` — **5/5** TypeScript strict build & MCP wire-protocol tests (12 tools)
- `cd web && npm test && npm run build` — **5/5** Playground, Breaker Lab, and `/diag` tests + Vite production build

### 2. Connect `hearthbounty-mcp` to Live Onyx (`onyx-1`)

```json
{
  "mcpServers": {
    "hearthbounty": {
      "command": "node",
      "args": ["/path/to/gno-tavern/mcp-server/dist/src/server.js"],
      "env": {
        "HEARTH_RPC_URL": "https://rpc.onyx.testnets.gno.land:443",
        "HEARTH_CHAIN_ID": "onyx-1",
        "HEARTH_REALM_PATH": "gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1",
        "HEARTH_GNOWEB_URL": "https://onyx.testnets.gno.land"
      }
    }
  }
}
```

### 3. Deploy Your Own Namespace to Onyx (`onyx-1`)

```bash
GNO_KEY_NAME=my-onyx-key \
GNO_NAMESPACE=<your-g1-address-or-handle> \
./scripts/deploy-onyx.sh
```

---

## License

MIT License. Built for the **Gnome Tavern Hackathon | Gno.land** on DoraHacks.
