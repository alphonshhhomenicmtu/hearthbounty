#!/usr/bin/env bash
set -euo pipefail

# Automated Gno.land Onyx Testnet (onyx-1) deployment script for HearthBounty.
# Never reads or exports private keys directly; delegates signing cleanly to gnokey.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export GNOROOT="${GNOROOT:-$ROOT_DIR/.tools/gno-root}"
export GNOHOME="${GNOHOME:-$ROOT_DIR/.tools/gno-home}"
GNO_BIN="${GNO_BIN:-$(command -v gno || echo "$ROOT_DIR/.tools/bin/gno")}"
GNOKEY_BIN="${GNOKEY_BIN:-$(command -v gnokey || echo "$ROOT_DIR/.tools/bin/gnokey")}"

CHAIN_ID="${GNO_CHAIN_ID:-onyx-1}"
RPC_URL="${GNO_RPC_URL:-https://rpc.onyx.testnets.gno.land:443}"
GNOWEB_URL="${GNO_GNOWEB_URL:-https://onyx.testnets.gno.land}"
GAS_FEE="${GNO_GAS_FEE:-150000ugnot}"
GAS_WANTED="${GNO_GAS_WANTED:-120000000}"
MAX_DEPOSIT="${GNO_MAX_DEPOSIT:-50000000ugnot}"
KEY_NAME="${GNO_KEY_NAME:-}"
NAMESPACE="${GNO_NAMESPACE:-}"

if [[ "$CHAIN_ID" == "gnoland-1" || "$CHAIN_ID" == "mainnet" ]]; then
  echo "Safety block: this script targets testnet (onyx-1) only, never mainnet." >&2
  exit 1
fi

if [[ -z "$KEY_NAME" ]]; then
  echo "Usage:"
  echo "  GNO_KEY_NAME=<your-gnokey-name> GNO_NAMESPACE=<your-g1-address-or-handle> $0"
  echo ""
  echo "Quick setup on Onyx testnet:"
  echo "  1. Create a fresh testnet key: gnokey add my-testnet-key"
  echo "  2. Fund it with testnet ugnot: https://faucet.gno.land"
  echo "  3. Deploy: GNO_KEY_NAME=my-testnet-key GNO_NAMESPACE=<g1-addr> $0"
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

ACTIVE_NS="$(grep -E '^module\s*=' "$ROOT_DIR"/r/*/hearthbounty/v0/gnomod.toml | head -n 1 | sed -E 's/.*"gno\.land\/r\/([^/]+)\/hearthbounty\/v0".*/\1/')"
PKG_CORE="gno.land/p/${ACTIVE_NS}/hearthcore/v0"
PKG_BOARD="gno.land/r/${ACTIVE_NS}/hearthbounty/v0"

echo "==> [3/6] Running local Gno tests and lint before broadcast"
(cd "$ROOT_DIR" && "$GNO_BIN" test ./p/... ./r/... && "$GNO_BIN" lint ./p/... ./r/...)

echo "==> [4/6] Deploying pure package: $PKG_CORE"
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

run_addpkg "$PKG_CORE" "$ROOT_DIR/p/${ACTIVE_NS}/hearthcore/v0"

echo "==> Waiting for $PKG_CORE to transition from inert to live..."
for _ in $(seq 1 30); do
  META="$("$GNOKEY_BIN" query vm/qpkgmeta_json -data "$PKG_CORE" -remote "$RPC_URL" 2>/dev/null || true)"
  if echo "$META" | grep -q '"status":"live"'; then
    echo "    $PKG_CORE is LIVE!"
    break
  fi
  sleep 2
done

echo "==> [5/6] Deploying stateful realm: $PKG_BOARD"
run_addpkg "$PKG_BOARD" "$ROOT_DIR/r/${ACTIVE_NS}/hearthbounty/v0"

echo "==> [6/6] Verifying live status & Render() on $CHAIN_ID"
for _ in $(seq 1 30); do
  META="$("$GNOKEY_BIN" query vm/qpkgmeta_json -data "$PKG_BOARD" -remote "$RPC_URL" 2>/dev/null || true)"
  if echo "$META" | grep -q '"status":"live"'; then
    echo "    $PKG_BOARD is LIVE!"
    break
  fi
  sleep 2
done

echo ""
echo "Deployment complete!"
echo "  Pure Package: ${GNOWEB_URL}/p/${ACTIVE_NS}/hearthcore/v0"
echo "  Live Realm:   ${GNOWEB_URL}/r/${ACTIVE_NS}/hearthbounty/v0"
echo "  MCP Config:   HEARTH_RPC_URL=${RPC_URL} HEARTH_CHAIN_ID=${CHAIN_ID} HEARTH_REALM_PATH=${PKG_BOARD}"
