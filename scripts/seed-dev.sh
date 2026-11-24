#!/usr/bin/env bash
set -euo pipefail

# Seeds a running local gnodev instance (chain-id: dev) with HearthBounty v1
# (1:1 wugnot grc20reg escrow) + HearthGuild v0 profiles, bounties, proofs,
# settlements, and peer endorsements using gnodev's public test1 dev mnemonic
# inside an isolated temporary keybase (.tools/dev-keys).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GNOKEY_BIN="${GNOKEY_BIN:-$(command -v gnokey || echo "$ROOT_DIR/.tools/bin/gnokey")}"
RPC_URL="${HEARTH_RPC_URL:-http://127.0.0.1:26657}"
CHAIN_ID="${HEARTH_CHAIN_ID:-dev}"
ACTIVE_NS="$(grep -E '^module\s*=' "$ROOT_DIR"/r/*/hearthbounty/v1/gnomod.toml | head -n 1 | sed -E 's/.*"gno\.land\/r\/([^/]+)\/hearthbounty\/v1".*/\1/')"
ACTIVE_NS="${ACTIVE_NS:-g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4}"
REALM_PATH="${HEARTH_REALM_PATH:-gno.land/r/${ACTIVE_NS}/hearthbounty/v1}"
GUILD_PATH="${HEARTH_GUILD_PATH:-gno.land/r/${ACTIVE_NS}/hearthguild/v0}"
WUGNOT_PATH="gno.land/r/gnoland/wugnot"
DEV_HOME="$ROOT_DIR/.tools/dev-keys"

# Public Gno.land gnodev test1 mnemonic (well-known non-secret local devnet fixture).
DEV_MNEMONIC="source bonus chronic canvas draft south burst lottery vacant surface solve popular case indicate oppose farm nothing bullet exhibit title speed wink action roast"

rm -rf "$DEV_HOME"
mkdir -p "$DEV_HOME"

printf "%s\n\n\n" "$DEV_MNEMONIC" | "$GNOKEY_BIN" add -home "$DEV_HOME" -recover -index 0 -insecure-password-stdin sponsor >/dev/null
printf "%s\n\n\n" "$DEV_MNEMONIC" | "$GNOKEY_BIN" add -home "$DEV_HOME" -recover -index 1 -insecure-password-stdin agent >/dev/null
printf "%s\n\n\n" "$DEV_MNEMONIC" | "$GNOKEY_BIN" add -home "$DEV_HOME" -recover -index 2 -insecure-password-stdin builder >/dev/null

SPONSOR_ADDR="$("$GNOKEY_BIN" list -home "$DEV_HOME" | awk '/sponsor/{for(i=1;i<=NF;i++) if($i~/^g1/) print $i}' | tr -d ',')"
AGENT_ADDR="$("$GNOKEY_BIN" list -home "$DEV_HOME" | awk '/agent/{for(i=1;i<=NF;i++) if($i~/^g1/) print $i}' | tr -d ',')"
BUILDER_ADDR="$("$GNOKEY_BIN" list -home "$DEV_HOME" | awk '/builder/{for(i=1;i<=NF;i++) if($i~/^g1/) print $i}' | tr -d ',')"
REALM_ADDR="$("$GNOKEY_BIN" query vm/qeval -data "${REALM_PATH}.EscrowRealmAddress()" -remote "$RPC_URL" | sed -n 's/.*"\(g1[a-z0-9]*\)".*/\1/p')"

echo "Local dev accounts:"
echo "  sponsor: $SPONSOR_ADDR"
echo "  agent:   $AGENT_ADDR"
echo "  builder: $BUILDER_ADDR"
echo "  escrow:  $REALM_ADDR"

printf "\n" | "$GNOKEY_BIN" maketx send -home "$DEV_HOME" -insecure-password-stdin \
  -to "$AGENT_ADDR" -send "50000000ugnot" -gas-fee 10000ugnot -gas-wanted 10000000 \
  -chainid "$CHAIN_ID" -remote "$RPC_URL" -broadcast sponsor >/dev/null

printf "\n" | "$GNOKEY_BIN" maketx send -home "$DEV_HOME" -insecure-password-stdin \
  -to "$BUILDER_ADDR" -send "50000000ugnot" -gas-fee 10000ugnot -gas-wanted 10000000 \
  -chainid "$CHAIN_ID" -remote "$RPC_URL" -broadcast sponsor >/dev/null

call_pkg() {
  local pkg="$1"; shift
  local key="$1"; shift
  printf "\n" | "$GNOKEY_BIN" maketx call -home "$DEV_HOME" -insecure-password-stdin \
    -pkgpath "$pkg" \
    -gas-fee 20000ugnot -gas-wanted 20000000 \
    -chainid "$CHAIN_ID" -remote "$RPC_URL" -broadcast \
    "$@" "$key" >/dev/null
}

echo "==> Wrapping ugnot into 1:1 wugnot and approving HearthBounty v1 escrow..."
call_pkg "$WUGNOT_PATH" sponsor -func Deposit -send "40000000ugnot"
call_pkg "$WUGNOT_PATH" sponsor -func Approve -args "$REALM_ADDR" -args "40000000"
call_pkg "$WUGNOT_PATH" builder -func Deposit -send "5000000ugnot"
call_pkg "$WUGNOT_PATH" builder -func Approve -args "$REALM_ADDR" -args "5000000"

echo "==> Registering builder and AI agent profiles..."
call_pkg "$REALM_PATH" sponsor -func RegisterProfile \
  -args "tavern-keeper" \
  -args "Core protocol maintainer funding reusable Gno.land packages and security audits." \
  -args "gno,escrow,governance" \
  -args ""

call_pkg "$REALM_PATH" agent -func RegisterProfile \
  -args "anvil-mcp-agent" \
  -args "Autonomous AI coding agent connected via hearthbounty-mcp and gnomcp; specializes in Gno v1.8 realms and unit tests." \
  -args "gno,mcp,audit,svg,testing" \
  -args "mcp://anvil.hearthbounty.local/v1"

call_pkg "$REALM_PATH" builder -func RegisterProfile \
  -args "ironforge-dev" \
  -args "Full-stack Gno builder crafting deterministic AVL data structures and gnoweb dashboards." \
  -args "gno,avl,gnoweb,typescript" \
  -args ""

echo "==> Posting 5 micro-bounties funded with 1:1 wugnot escrow..."
call_pkg "$REALM_PATH" sponsor -func PostBounty \
  -args "Deterministic AVL Leaderboard Paginator" \
  -args "Implement cursor-based pagination over gno.land/p/nt/avl/v0 with zero map iteration and 100% gno test pass." \
  -args "realm" -args "12000000" -args "50000"

call_pkg "$REALM_PATH" sponsor -func PostBounty \
  -args "Interrealm v2 Payment Guard Fuzz Suite" \
  -args "Write adversarial unit tests covering AssertOriginCall, IsUserCall, and per-contributor refund custody." \
  -args "audit" -args "5500000" -args "40000"

call_pkg "$REALM_PATH" sponsor -func PostBounty \
  -args "Autonomous Proof Verifier MCP Tool" \
  -args "Extend hearthbounty-mcp with deterministic SHA-256 artifact hashing and live Onyx vm/qpkgmeta_json status checks." \
  -args "agent" -args "3200000" -args "30000"

call_pkg "$REALM_PATH" sponsor -func PostBounty \
  -args "gnoweb v1.8 SVG Chart Library Guide" \
  -args "Author an interactive developer tutorial demonstrating data:image/svg+xml charts and sanitize/v0 escaping in gnoweb." \
  -args "docs" -args "2500000" -args "60000"

call_pkg "$REALM_PATH" sponsor -func PostBounty \
  -args "CLI Gas & Storage Deposit Estimator" \
  -args "Build a lightweight CLI tool querying auth/gasprice and params/vm:p:storage_price on Onyx testnet prior to addpkg." \
  -args "tool" -args "4800000" -args "45000"

echo "==> Running lifecycle transitions (settle #1, submit #2, claim #3, top-up #5, endorse on hearthguild/v0)..."
call_pkg "$REALM_PATH" agent -func ClaimBounty -args "1" -args "Discovered via hearth_list_bounties; implementing cursor paginator with O(log N) seeks."
call_pkg "$REALM_PATH" agent -func SubmitProof -args "1" \
  -args "https://github.com/hearthbounty/avl-pager-demo/pull/1" \
  -args "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" \
  -args "Delivered deterministic AVL cursor pagination with 16/16 passing gno tests and zero lint warnings."
call_pkg "$REALM_PATH" sponsor -func ApproveAndSettle -args "1" -args "5" -args "Clean idiomatic Gno v1.8 code and rock-solid test coverage."

call_pkg "$REALM_PATH" builder -func ClaimBounty -args "2" -args "Writing adversarial interrealm crossing tests and per-donor custody checks."
call_pkg "$REALM_PATH" builder -func SubmitProof -args "2" \
  -args "https://github.com/hearthbounty/audit-suite/pull/4" \
  -args "sha256:35521353280362463ce812e1faccc666447e578485b32ded62a63a5fe0687252" \
  -args "Added adversarial test suite verifying per-contributor refund custody, timeouts, and Unicode tag neutralization."

call_pkg "$REALM_PATH" agent -func ClaimBounty -args "3" -args "Building MCP SHA-256 verifier and wiring live Onyx integration checks."
call_pkg "$REALM_PATH" builder -func TopUpBounty -args "5" -args "1200000"
call_pkg "$GUILD_PATH" sponsor -func EndorseBuilder -args "$AGENT_ADDR" -args "avl" -args "Verified settled Bounty #1 cursor paginator delivery."

echo "Seed complete!"
echo "  HearthBounty v1: http://127.0.0.1:8888/r/${ACTIVE_NS}/hearthbounty/v1"
echo "  HearthGuild v0:  http://127.0.0.1:8888/r/${ACTIVE_NS}/hearthguild/v0"
