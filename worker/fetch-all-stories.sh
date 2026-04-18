#!/bin/bash
# Fetch all stories from KV and display them

KEYS=("story:diagdog-uwil" "story:felix-salmon-4c6d" "story:felix-snmy" "story:lexie-ma7i" "story:unittestdog-7zpb")

for key in "${KEYS[@]}"; do
  echo "=========================================="
  echo "KEY: $key"
  echo "=========================================="
  wrangler kv key get "$key" --binding=STORIES --remote --text
  echo ""
done
