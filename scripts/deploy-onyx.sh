#!/usr/bin/env bash
set -euo pipefail

# Automated Gno.land Onyx Testnet (onyx-1) deployment script for HearthBounty v1 + HearthGuild v0.
# Never reads or exports private keys directly; delegates signing cleanly to gnokey.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export GNOROOT="${GNOROOT:-$ROOT_DIR/.tools/gno-root}"
export GNOHOME="${GNOHOME:-$ROOT_DIR/.tools/gno-home}"
GNO_BIN="${GNO_BIN:-$(command -v gno || echo "$ROOT_DIR/.tools/bin/gno")}"
GNOKEY_BIN="${GNOKEY_BIN:-$(command -v gnokey || echo "$ROOT_DIR/.tools/bin/gnokey")}"

CHAIN_ID="${GNO_CHAIN_ID:-onyx-1}"
RPC_URL="${GNO_RPC_URL:-https://rpc.onyx.testnets.gno.land:443}"
GNOWEB_URL="${GNO_GNOWEB_URL:-https://onyx.testnets.gno.land}"
GAS_FEE="${GNO_GAS_FEE:-200000ugnot}"
GAS_WANTED="${GNO_GAS_WANTED:-150000000}"
MAX_DEPOSIT="${GNO_MAX_DEPOSIT:-100000000ugnot}"
KEY_NAME="${GNO_KEY_NAME:-}"
NAMESPACE="${GNO_NAMESPACE:-}"

if [[ "$CHAIN_ID" == "gnoland-1" || "$CHAIN_ID" == "mainnet" ]]; then
  echo "Safety block: this script targets testnet (onyx-1) only, never mainnet." >&2
  exit 1
fi

if [[ -z "$KEY_NAME" ]]; then
  echo "Usage:"
  echo "  GNO_KEY_NAME=<your-gnokey-name> GNO_NAMESPACE=<your-g1-address-or-handle> $0"
  exit 1
fi

echo "==> [1/6] Checking Onyx RPC liveness ($RPC_URL)"
curl -fsS --max-time 10 "${RPC_URL}/status" | grep -q "\"network\": \"${CHAIN_ID}\"" || {
  echo "Error: RPC at $RPC_URL did not report chain-id $CHAIN_ID." >&2
  exit 1
}

if [[ -n "$NAMESPACE" ]]; then
  echo "==> [2/6] Configuring module namespace: $NAMESPACE"
  "$ROOT_DIR/scripts/set-namespace.sh" "$NAMESPACE"
fi

ACTIVE_NS="$(grep -E '^module\s*=' "$ROOT_DIR"/r/*/hearthbounty/v1/gnomod.toml | head -n 1 | sed -E 's/.*"gno\.land\/r\/([^/]+)\/hearthbounty\/v1".*/\1/')"
PKG_CORE="gno.land/p/${ACTIVE_NS}/hearthcore/v0"
PKG_BOARD="gno.land/r/${ACTIVE_NS}/hearthbounty/v1"
PKG_GUILD="gno.land/r/${ACTIVE_NS}/hearthguild/v0"

echo "==> [3/6] Running local Gno tests and lint before broadcast"
(cd "$ROOT_DIR" && "$GNO_BIN" test -root-dir "$GNOROOT" ./p/... ./r/... && "$GNO_BIN" lint -root-dir "$GNOROOT" ./p/... ./r/...)

run_addpkg() {
  local pkgpath="$1"
  local pkgdir="$2"
  if [[ "${GNO_INSECURE_PASSWORD_STDIN:-0}" == "1" ]]; then
    printf "\n" | "$GNOKEY_BIN" maketx addpkg \
      -pkgpath "$pkgpath" \
      -pkgdir "$pkgdir" \
      -max-deposit "$MAX_DEPOSIT" \
      -gas-fee "$GAS_FEE" \
      -gas-wanted "$GAS_WANTED" \
      -chainid "$CHAIN_ID" \
      -remote "$RPC_URL" \
      -insecure-password-stdin \
      -broadcast \
      "$KEY_NAME"
  else
    "$GNOKEY_BIN" maketx addpkg \
      -pkgpath "$pkgpath" \
      -pkgdir "$pkgdir" \
      -max-deposit "$MAX_DEPOSIT" \
      -gas-fee "$GAS_FEE" \
      -gas-wanted "$GAS_WANTED" \
      -chainid "$CHAIN_ID" \
      -remote "$RPC_URL" \
      -broadcast \
      "$KEY_NAME"
  fi
}

echo "==> [4/6] Deploying pure package (if absent): $PKG_CORE"
if ! "$GNOKEY_BIN" query vm/qpkgmeta_json -data "$PKG_CORE" -remote "$RPC_URL" 2>/dev/null | grep -q '"status":"live"'; then
  run_addpkg "$PKG_CORE" "$ROOT_DIR/p/${ACTIVE_NS}/hearthcore/v0"
else
  echo "    $PKG_CORE is already live on $CHAIN_ID."
fi

echo "==> [5/6] Deploying hardened stateful realm (1:1 wugnot grc20reg): $PKG_BOARD"
run_addpkg "$PKG_BOARD" "$ROOT_DIR/r/${ACTIVE_NS}/hearthbounty/v1"

echo "==> [6/6] Deploying companion consumer realm (imports hearthcore/v0 + hearthbounty/v1): $PKG_GUILD"
run_addpkg "$PKG_GUILD" "$ROOT_DIR/r/${ACTIVE_NS}/hearthguild/v0"

echo ""
echo "Deployment broadcast complete (Onyx GPAO auto-enables non-banker realms in ~60 min):"
echo "  Pure Package:    ${GNOWEB_URL}/p/${ACTIVE_NS}/hearthcore/v0"
echo "  Bounty Realm v1: ${GNOWEB_URL}/r/${ACTIVE_NS}/hearthbounty/v1"
echo "  Guild Consumer:  ${GNOWEB_URL}/r/${ACTIVE_NS}/hearthguild/v0"
echo "  MCP Config:      HEARTH_RPC_URL=${RPC_URL} HEARTH_CHAIN_ID=${CHAIN_ID} HEARTH_REALM_PATH=${PKG_BOARD}"
