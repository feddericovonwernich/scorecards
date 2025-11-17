#!/bin/bash
# Script: tests/baseline/capture-baseline.sh

CATALOG_BRANCH="catalog"
BASELINE_DIR="tests/baseline/pre-refactor"

# Checkout catalog branch to inspect current results
cd /home/fedderico/Repos/scorecards-workspace/scorecards || exit
git fetch origin $CATALOG_BRANCH
git checkout $CATALOG_BRANCH

# Capture current results for each test repo
for repo in test-repo-{perfect,python,javascript,edge-cases,no-docs,minimal,empty,install-test}; do
  echo "Capturing baseline for $repo..."

  # Copy current results if they exist
  if [ -f "catalog/services/feddericovonwernich/${repo}.json" ]; then
    cp "catalog/services/feddericovonwernich/${repo}.json" \
       "$BASELINE_DIR/${repo}-results.json"

    # Extract key metrics
    jq '{
      repo: .repo,
      score: .score,
      rank: .rank,
      passed_checks: .passed_checks,
      total_checks: .total_checks,
      checks_hash: .checks_hash,
      has_api: .has_api
    }' "$BASELINE_DIR/${repo}-results.json" \
       > "$BASELINE_DIR/${repo}-metrics.json"

    echo "  Score: $(jq -r '.score' "$BASELINE_DIR/${repo}-metrics.json")%"
    echo "  Rank: $(jq -r '.rank' "$BASELINE_DIR/${repo}-metrics.json")"
  else
    echo "  WARNING: No existing results found"
    echo '{"error": "no_baseline"}' > "$BASELINE_DIR/${repo}-metrics.json"
  fi
done

# Return to main branch
git checkout main

echo "Baseline captured in $BASELINE_DIR"
