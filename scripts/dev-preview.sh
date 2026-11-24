#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export GNOROOT="${GNOROOT:-$ROOT_DIR/.tools/gno-root}"
export GNOHOME="${GNOHOME:-$ROOT_DIR/.tools/gno-home}"
GNO_DEV_BIN="${GNO_DEV_BIN:-$(command -v gnodev || echo "$ROOT_DIR/.tools/bin/gnodev")}"
DEV_HOME="$ROOT_DIR/.tools/gnodev-home"
PORT_WEB="${PORT_WEB:-8888}"
PORT_RPC="${PORT_RPC:-26657}"

if [[ ! -x "$GNO_DEV_BIN" ]]; then
  echo "Error: gnodev binary not found. Install Gno v1.8.0 or place binaries in .tools/bin." >&2
  exit 1
fi

mkdir -p "$DEV_HOME"

ACTIVE_NS="$(grep -E '^module\s*=' "$ROOT_DIR"/r/*/hearthbounty/v1/gnomod.toml | head -n 1 | sed -E 's/.*"gno\.land\/r\/([^/]+)\/hearthbounty\/v1".*/\1/')"
ACTIVE_NS="${ACTIVE_NS:-g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4}"

echo "Starting local gnodev for HearthBounty v1 + HearthGuild v0..."
echo "  RPC:     http://127.0.0.1:${PORT_RPC}"
echo "  gnoweb:  http://127.0.0.1:${PORT_WEB}/r/${ACTIVE_NS}/hearthbounty/v1"
echo "  guild:   http://127.0.0.1:${PORT_WEB}/r/${ACTIVE_NS}/hearthguild/v0"

cd "$ROOT_DIR"
exec "$GNO_DEV_BIN" local \
  -root "$GNOROOT" \
  -home "$DEV_HOME" \
  -node-rpc-listener "127.0.0.1:${PORT_RPC}" \
  -web-listener "127.0.0.1:${PORT_WEB}" \
  -web-home "/r/${ACTIVE_NS}/hearthbounty/v1" \
  -no-watch
