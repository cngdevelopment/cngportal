#!/bin/sh
# Spec §12.8 — no-pricing gate. Zero hits outside comments = pass.
# Run in CI on every PR.
set -e
PATTERN='price|subtotal|currency|\busd\b|\$[0-9]'
HITS=$(grep -rniE "$PATTERN" src prisma \
  --include='*.ts' --include='*.tsx' --include='*.prisma' --include='*.sql' \
  | grep -viE '^\s*[^:]+:[0-9]+:\s*(//|--|\*|/\*)' || true)
if [ -n "$HITS" ]; then
  echo "PRICING TERMS FOUND — spec §2 rule 6 violation:"
  echo "$HITS"
  exit 1
fi
echo "no-pricing check passed"
