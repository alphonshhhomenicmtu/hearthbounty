#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <namespace-or-g1-address>" >&2
  echo "Example: $0 g1youraddresshere" >&2
  exit 1
fi

NEW_NS="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Detect current namespace from r/.../hearthbounty/v0/gnomod.toml
CURRENT_MOD="$(grep -E '^module\s*=' "$ROOT_DIR"/r/*/hearthbounty/v0/gnomod.toml | head -n 1 | sed -E 's/.*"gno\.land\/r\/([^/]+)\/hearthbounty\/v0".*/\1/')"
if [[ -z "$CURRENT_MOD" ]]; then
  echo "Error: could not detect current namespace." >&2
  exit 1
fi

if [[ "$CURRENT_MOD" == "$NEW_NS" ]]; then
  echo "Namespace is already '$NEW_NS'."
  exit 0
fi

echo "Renaming namespace: $CURRENT_MOD -> $NEW_NS"
mv "$ROOT_DIR/p/$CURRENT_MOD" "$ROOT_DIR/p/$NEW_NS"
mv "$ROOT_DIR/r/$CURRENT_MOD" "$ROOT_DIR/r/$NEW_NS"

while IFS= read -r file; do
  perl -0pi -e "s|gno\\.land/p/\Q$CURRENT_MOD\E/hearthcore/v0|gno.land/p/$NEW_NS/hearthcore/v0|g; s|gno\\.land/r/\Q$CURRENT_MOD\E/hearthbounty/v0|gno.land/r/$NEW_NS/hearthbounty/v0|g; s|/r/\Q$CURRENT_MOD\E/hearthbounty/v0|/r/$NEW_NS/hearthbounty/v0|g" "$file"
done < <(find "$ROOT_DIR/p/$NEW_NS" "$ROOT_DIR/r/$NEW_NS" -type f \( -name '*.gno' -o -name 'gnomod.toml' \))

echo "Done! Updated module paths:"
echo "  gno.land/p/$NEW_NS/hearthcore/v0"
echo "  gno.land/r/$NEW_NS/hearthbounty/v0"
