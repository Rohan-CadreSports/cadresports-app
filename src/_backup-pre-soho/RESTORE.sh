#!/bin/bash
# Run this script to revert the Soho House redesign back to the original UI
# Usage: bash src/_backup-pre-soho/RESTORE.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"

cp "$DIR/globals.css" "$ROOT/app/globals.css"
cp "$DIR/layout.tsx" "$ROOT/app/layout.tsx"
cp "$DIR/page.tsx" "$ROOT/app/page.tsx"
cp "$DIR/navbar.tsx" "$ROOT/components/layout/navbar.tsx"
cp "$DIR/bottom-nav.tsx" "$ROOT/components/layout/bottom-nav.tsx"
cp "$DIR/home-leagues.tsx" "$ROOT/components/home-leagues.tsx"
cp "$DIR/button.tsx" "$ROOT/components/ui/button.tsx"
cp "$DIR/card.tsx" "$ROOT/components/ui/card.tsx"
cp "$DIR/badge.tsx" "$ROOT/components/ui/badge.tsx"
cp "$DIR/city-selector.tsx" "$ROOT/components/city-selector.tsx"

echo "Reverted to pre-Soho House UI. Restart dev server."
