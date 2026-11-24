# Gnome Tavern Hackathon | Gno.land — Verified Specification

> **Captured:** 2026-11-24 (via live inspection of `https://dorahacks.io/hackathon/gnome-tavern/detail`, `https://docs.gno.land/resources/gnoland-networks/`, `https://rpc.onyx.testnets.gno.land:443/status`, `https://github.com/gnolang/gno` release `v1.8.0`, and `https://github.com/gnoverse/gno-mcp`).

## 1. Hackathon Overview & Prizes

- **Event:** Gnome Tavern Hackathon | Gno.land
- **Platform:** DoraHacks (`https://dorahacks.io/hackathon/gnome-tavern/detail`)
- **Organizer:** GnoLand (BVI) Limited
- **Submission Window:** `2026-11-23 01:00 UTC` — `2026-12-18 01:00 UTC`
- **Judging Period:** `2026-12-18` — `2026-12-21`
- **Winners Announced & KYC:** `2026-12-21` (KYC deadline `2026-12-22`; payouts `2026-12-23` — `2026-12-24`)
- **Total Prize Pool:** **$20,000 USD** (paid in `GNOT`, or `USDC` where legally required)
  - **$10,000 Upfront Prizes (16 winners):**
    - **1st Place:** $2,000 (1 project)
    - **2nd Place:** $1,000 (1 project)
    - **Builder Awards:** $500 each (14 projects, $7,000 total)
  - **$10,000 Builder Retention Prize:** Matches each winner's upfront prize (50% at month 3, 50% at month 6) for projects live on mainnet, actively updated monthly, reaching 50/100 unique addresses, imported/used by >=1 other project, and supported by an active community.

## 2. Judging Rubric

| Criterion | Weight | What Judges Evaluate |
|---|---|---|
| **Technical Quality** | **40%** | Correct, clear, idiomatic Gno code that works as described in the live deployment |
| **User Appeal** | **20%** | Something people want to use or share, with a clear and polished experience |
| **Creativity** | **20%** | Original idea or a fresh take on what can be built on Gno.land |
| **Docs & Demo** | **20%** | Clear README explaining what the project does and how to use it, plus a clear demo showing the working product |

## 3. Hard Eligibility & Naming Rules

1. **CRITICAL NAMING RULE:** Project names **MUST NOT use the `"Gno"` prefix** or any name/branding implying an official connection to or endorsement by Gno.land. Projects violating this rule may be disqualified.
   - **Selected Project Name:** **`HearthBounty`** (contains zero `"Gno"` prefix or substring; authentic tavern-hearth bounty board identity).
2. **Mandatory Deliverables:**
   - Live working deployment on the **Gno.land testnet** (`onyx-1`) with deployment link (`https://onyx.testnets.gno.land/r/<namespace>/hearthbounty/v0`)
   - Public code repository (GitHub/GitLab/Bitbucket)
   - Genuine Gno component (stateful `/r/` realm and reusable `/p/` package)
   - Clear `README.md` with usage & deployment guide
   - Short demo video showcasing the live working application
   - Short project description
3. **Disqualifiers:** Mockups/slides/concepts only; undeployed code; projects lacking a real Gno component; copied/duplicate/mass-generated submissions; `"Gno"`-prefixed names.

## 4. Eligible Tracks / Starting Points

No rigid thematic restriction; encouraged categories:
- **dApp:** DeFi, AI, gaming, or social applications usable on Gno.land
- **Realm:** Stateful smart contracts written in Gno (tokens, NFTs, DAOs, registries, escrows)
- **Tool:** SDKs, CLIs, testing utilities, indexers, wallet integrations, or **AI agents built with `gnomcp`**
- **Demo:** Complete end-to-end working app rendering directly in **`gnoweb`**

`HearthBounty` spans **Realm + dApp + gnoweb Native UI + AI Agent MCP Tooling (`gnomcp`-compatible)** in one cohesive vertical product.

## 5. Verified Gno.land Network & Toolchain Details (Nov 2026)

### Active Testnet: Onyx (`onyx-1`)

| Field | Verified Value |
|---|---|
| **Network Name** | Onyx / Test17 (default writable testnet) |
| **Chain ID** | `onyx-1` |
| **RPC Endpoint** | `https://rpc.onyx.testnets.gno.land:443` (verified live at block `1,366,637+`) |
| **gnoweb Explorer** | `https://onyx.testnets.gno.land` |
| **Tx Indexer (GraphQL)** | `https://indexer.onyx.testnets.gno.land/graphql/query` |
| **Testnet Faucet** | `https://faucet.gno.land` |
| **Release Version** | `v1.8.0` / `v1.8.0-rc.1` (commit `fc79041f4`) |
| **Gas Price Floor** | `1ugnot/1000gas` (10M gas minimum fee = `10000ugnot` = `0.01 GNOT`) |
| **Storage Deposit** | `100 ugnot/byte` (default cap `100 GNOT`) |
| **Code Submission Policy** | `inert` (auto-approved after deployment; verify via `vm/qpkgmeta_json` until `status: "live"`) |
| **CLA Gate (`r/sys/cla`)** | `OFF` (verify before deploy) |
| **Namespace Gate** | `ON` — personal address namespace `gno.land/r/<g1addr>/*` is free; named namespaces registered via `r/sys/namereg/v0` |
| **`MsgRun`** | Allowlisted (`run_submitters`); use `addpkg` + `maketx call` on `onyx-1` |

### Local Development (`gnodev`)

| Field | Verified Value |
|---|---|
| **Toolchain Release** | `gnolang/gno v1.8.0` (`gno`, `gnodev`, `gnokey` macOS arm64 SHA256-verified) |
| **Local Chain ID** | `dev` |
| **Local RPC** | `http://127.0.0.1:26657` |
| **Local gnoweb** | `http://127.0.0.1:8888` |

### Verified `onyx-1` Standard & Community Packages (Leaf-Versioned `/v0`)

Confirmed live on `rpc.onyx.testnets.gno.land:443` via `vm/qpaths`:
- `gno.land/p/nt/avl/v0` & `gno.land/p/nt/avl/pager/v0`
- `gno.land/p/nt/mux/v0`
- `gno.land/p/nt/markdown/sanitize/v0` & `gno.land/p/nt/markdown/foreign/v0`
- `gno.land/p/nt/seqid/v0`
- `gno.land/p/nt/svg/v0`
- `gno.land/p/nt/ufmt/v0`
- `gno.land/p/nt/uassert/v0` & `gno.land/p/nt/urequire/v0`
- `gno.land/p/nt/testutils/v0`
- `gno.land/p/nt/ownable/v0`
- `gno.land/p/moul/txlink/v0`, `gno.land/p/moul/md/v0`, `gno.land/p/moul/mdtable/v0`

### Gno v1.8.0 Security & Language Rules Enforced in HearthBounty

1. **Interrealm v2 Crossing Discipline:** Every state-mutating entrypoint accepts `cur realm` as its first parameter; caller identity is always derived from runtime-current `cur.Previous().Address()`. Never use `unsafe.PreviousRealm()` for authorization.
2. **Payment & Escrow Guards:** Every payable function verifies `cur.Previous().IsUserCall()`, validates `banker.OriginSend()` contains exclusively positive `ugnot` coins, follows Checks-Effects-Interactions (CEI), and releases funds via `banker.NewBanker(banker.BankerTypeRealmSend, cur)`.
3. **Strict Determinism:** Pure Gno subset only (no `os`, `net/http`, wall-clock randomness, float math for financial splits). All ordered state uses `avl.Tree` + `seqid.ID`; dispute splits use integer basis points (`0..10000`).
4. **Render Safety:** `Render(path string) string` is strictly read-only, uses `p/nt/mux/v0` routing, sanitizes every user-controlled string with `p/nt/markdown/sanitize/v0` plus `\$` math escaping, and leverages native gnoweb v1.8.0 extensions (`<gno-columns>`, `<gno-frame>`, `<gno-form>`, `<gno-button />`, `<gno-icon />`, callout alerts, and deterministic on-chain SVG `data:image/svg+xml;base64,...` visuals).
5. **AI Agent MCP Bridge (`gnomcp`-compatible):** Ships a dedicated TypeScript MCP server (`hearthbounty-mcp`) + CLI that speaks native Tendermint ABCI JSON-RPC (`vm/qeval`, `vm/qrender`, `vm/qpkgmeta_json`, `/status`), integrates alongside official `gnomcp` (`https://mcp.gno.dev`), and enforces testnet/devnet-only write safety (never signs on `gnoland-1` mainnet).

## 6. Official Ecosystem Links

- Docs: `https://docs.gno.land`
- Getting Started: `https://docs.gno.land/builders/getting-started`
- Networks: `https://docs.gno.land/resources/gnoland-networks`
- Faucet: `https://faucet.gno.land`
- gnodev: `https://docs.gno.land/resources/gnodev`
- Playground: `https://play.gno.land`
- gnomcp: `https://mcp.gno.dev` / `https://github.com/gnoverse/gno-mcp`
- Adena Wallet: `https://adena.app`
- GnoScan Explorer: `https://gnoscan.io`
- Gno Monorepo: `https://github.com/gnolang/gno`
