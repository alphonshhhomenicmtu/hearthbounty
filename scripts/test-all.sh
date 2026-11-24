#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export GNOROOT="${GNOROOT:-$ROOT_DIR/.tools/gno-root}"
export GNOHOME="${GNOHOME:-$ROOT_DIR/.tools/gno-home}"
GNO_BIN="${GNO_BIN:-$(command -v gno || echo "$ROOT_DIR/.tools/bin/gno")}"

if [[ ! -x "$GNO_BIN" ]]; then
  echo "Error: gno binary not found. Install Gno v1.8.0 or place binaries in .tools/bin." >&2
  exit 1
fi

# Isolate local .tools workspace so gno does not walk internal benchops stubs.
if [[ -d "$ROOT_DIR/.tools" && ! -f "$ROOT_DIR/.tools/gnowork.toml" ]]; then
  touch "$ROOT_DIR/.tools/gnowork.toml"
fi

echo "==> Running Gno package & realm tests"
(cd "$ROOT_DIR" && "$GNO_BIN" test -v -root-dir "$GNOROOT" ./p/... ./r/...)

echo "==> Running Gno linter"
(cd "$ROOT_DIR" && "$GNO_BIN" lint -root-dir "$GNOROOT" ./p/... ./r/...)

echo "==> Running TypeScript MCP server build & unit tests"
(cd "$ROOT_DIR/mcp-server" && npm test)

if [[ -d "$ROOT_DIR/web/node_modules" ]]; then
  echo "==> Running Interactive Web Playground tests & production build"
  (cd "$ROOT_DIR/web" && npm test && npm run build)
fi

echo "ALL CHECKS PASSED."
