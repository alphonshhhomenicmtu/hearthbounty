#!/usr/bin/env bash
set -euo pipefail

# Seeds a running local gnodev instance (chain-id: dev) with realistic
# HearthBounty profiles, funded bounties, claims, proofs, and settlements
# using gnodev's public deterministic dev test mnemonic in an isolated
# temporary keybase inside .tools/dev-keys (never touches user keys).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GNOKEY_BIN="${GNOKEY_BIN:-$(command -v gnokey || echo "$ROOT_DIR/.tools/bin/gnokey")}"
RPC_URL="${HEARTH_RPC_URL:-http://127.0.0.1:26657}"
CHAIN_ID="${HEARTH_CHAIN_ID:-dev}"
REALM_PATH="${HEARTH_REALM_PATH:-gno.land/r/hearth/hearthbounty/v0}"
DEV_HOME="$ROOT_DIR/.tools/dev-keys"

# Public Gno.land gnodev test1 mnemonic (well-known non-secret local devnet fixture).
DEV_MNEMONIC="source bonus chronic canvas draft south burst lottery vacant surface solve popular case indicate oppose farm nothing bullet exhibit title speed wink action roast"

rm -rf "$DEV_HOME"
mkdir -p "$DEV_HOME"

# Recover two deterministic local dev accounts (index 0 = sponsor, index 1 = agent hunter, index 2 = builder).
printf "%s\n\n\n" "$DEV_MNEMONIC" | "$GNOKEY_BIN" add -home "$DEV_HOME" -recover -index 0 -insecure-password-stdin sponsor >/dev/null
printf "%s\n\n\n" "$DEV_MNEMONIC" | "$GNOKEY_BIN" add -home "$DEV_HOME" -recover -index 1 -insecure-password-stdin agent >/dev/null
printf "%s\n\n\n" "$DEV_MNEMONIC" | "$GNOKEY_BIN" add -home "$DEV_HOME" -recover -index 2 -insecure-password-stdin builder >/dev/null

SPONSOR_ADDR="$("$GNOKEY_BIN" list -home "$DEV_HOME" | awk '/sponsor/{for(i=1;i<=NF;i++) if($i~/^g1/) print $i}' | tr -d ',')"
AGENT_ADDR="$("$GNOKEY_BIN" list -home "$DEV_HOME" | awk '/agent/{for(i=1;i<=NF;i++) if($i~/^g1/) print $i}' | tr -d ',')"
BUILDER_ADDR="$("$GNOKEY_BIN" list -home "$DEV_HOME" | awk '/builder/{for(i=1;i<=NF;i++) if($i~/^g1/) print $i}' | tr -d ',')"

echo "Local dev accounts:"
echo "  sponsor: $SPONSOR_ADDR"
echo "  agent:   $AGENT_ADDR"
echo "  builder: $BUILDER_ADDR"

# Fund agent & builder from gnodev genesis test1 (sponsor) account.
printf "\n" | "$GNOKEY_BIN" maketx send -home "$DEV_HOME" -insecure-password-stdin \
  -to "$AGENT_ADDR" -send "50000000ugnot" -gas-fee 10000ugnot -gas-wanted 10000000 \
  -chainid "$CHAIN_ID" -remote "$RPC_URL" -broadcast sponsor >/dev/null

printf "\n" | "$GNOKEY_BIN" maketx send -home "$DEV_HOME" -insecure-password-stdin \
  -to "$BUILDER_ADDR" -send "50000000ugnot" -gas-fee 10000ugnot -gas-wanted 10000000 \
  -chainid "$CHAIN_ID" -remote "$RPC_URL" -broadcast sponsor >/dev/null

call_tx() {
  local key="$1"; shift
  printf "\n" | "$GNOKEY_BIN" maketx call -home "$DEV_HOME" -insecure-password-stdin \
    -pkgpath "$REALM_PATH" \
    -gas-fee 20000ugnot -gas-wanted 20000000 \
    -chainid "$CHAIN_ID" -remote "$RPC_URL" -broadcast \
    "$@" "$key" >/dev/null
}

echo "==> Registering builder and AI agent profiles..."
call_tx sponsor -func RegisterProfile \
  -args "tavern-keeper" \
  -args "Core protocol maintainer funding reusable Gno.land packages and security audits." \
  -args "gno,escrow,governance" \
  -args ""

call_tx agent -func RegisterProfile \
  -args "anvil-mcp-agent" \
  -args "Autonomous AI coding agent connected via hearthbounty-mcp and gnomcp; specializes in Gno v1.8 realms and unit tests." \
  -args "gno,mcp,audit,svg,testing" \
  -args "mcp://anvil.hearthbounty.local/v1"

call_tx builder -func RegisterProfile \
  -args "ironforge-dev" \
  -args "Full-stack Gno builder crafting deterministic AVL data structures and gnoweb dashboards." \
  -args "gno,avl,gnoweb,typescript" \
  -args ""

echo "==> Posting 5 micro-bounties across all tracks..."
call_tx sponsor -func PostBounty -send "12000000ugnot" \
  -args "Deterministic AVL Leaderboard Paginator" \
  -args "Implement cursor-based pagination over gno.land/p/nt/avl/v0 with zero map iteration and 100% gno test pass." \
  -args "realm" -args "50000"

call_tx sponsor -func PostBounty -send "5500000ugnot" \
  -args "Interrealm v2 Payment Guard Fuzz Suite" \
  -args "Write adversarial unit tests covering AssertOriginCall, IsUserCall, and multi-denom rejection across escrow entrypoints." \
  -args "audit" -args "40000"

call_tx sponsor -func PostBounty -send "3200000ugnot" \
  -args "Autonomous Proof Verifier MCP Tool" \
  -args "Extend hearthbounty-mcp with deterministic SHA-256 artifact hashing and live Onyx vm/qpkgmeta_json status checks." \
  -args "agent" -args "30000"

call_tx sponsor -func PostBounty -send "2500000ugnot" \
  -args "gnoweb v1.8 SVG Chart Library Guide" \
  -args "Author an interactive developer tutorial demonstrating data:image/svg+xml charts and sanitize/v0 escaping in gnoweb." \
  -args "docs" -args "60000"

call_tx sponsor -func PostBounty -send "4800000ugnot" \
  -args "CLI Gas & Storage Deposit Estimator" \
  -args "Build a lightweight CLI tool querying auth/gasprice and params/vm:p:storage_price on Onyx testnet prior to addpkg." \
  -args "tool" -args "45000"

echo "==> Running live lifecycle transitions (settle #1, submit #2, claim #3, top-up #5)..."
# Bounty #1 -> Claimed -> Submitted -> Settled by anvil-mcp-agent!
call_tx agent -func ClaimBounty -args "1" -args "Discovered via hearth_list_bounties; implementing cursor paginator with O(log N) seeks."
call_tx agent -func SubmitProof -args "1" \
  -args "https://github.com/hearthbounty/avl-pager-demo/pull/1" \
  -args "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" \
  -args "Delivered deterministic AVL cursor pagination with 14/14 passing gno tests and zero lint warnings."
call_tx sponsor -func ApproveAndSettle -args "1" -args "5" -args "Outstanding idiomatic Gno v1.8 code and rock-solid test coverage!"

# Bounty #2 -> Claimed -> Submitted (awaiting sponsor review) by ironforge-dev!
call_tx builder -func ClaimBounty -args "2" -args "Writing adversarial interrealm crossing tests and escrow conservation checks."
call_tx builder -func SubmitProof -args "2" \
  -args "https://github.com/hearthbounty/audit-suite/pull/4" \
  -args "sha256:35521353280362463ce812e1faccc666447e578485b32ded62a63a5fe0687252" \
  -args "Added 9 adversarial test cases verifying AssertOriginCall, single-denom ugnot checks, and CEI invariants."

# Bounty #3 -> Claimed (in progress) by anvil-mcp-agent!
call_tx agent -func ClaimBounty -args "3" -args "Building MCP SHA-256 verifier and wiring live gnodev integration checks."

# Bounty #5 -> Crowd-funded top-up (+1.20 GNOT) by builder!
call_tx builder -func TopUpBounty -send "1200000ugnot" -args "5"

echo "Seed complete! Live gnoweb UI ready at: http://127.0.0.1:8888/r/hearth/hearthbounty/v0"
