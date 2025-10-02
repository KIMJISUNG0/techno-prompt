#!/usr/bin/env bash
set -euo pipefail
echo "[diag] pwd=$(pwd)"
echo "[diag] ls -1 ."; ls -1 . | head -n 40
echo "[diag] node version:"; node -v
echo "[diag] npm version:"; npm -v
echo "[diag] listing src (if exists)"; ls -1 src || true
echo "[diag] package.json snippet:"; head -n 40 package.json || true
echo "[diag] running npm install"
npm install --no-audit --no-fund
echo "[diag] build start"
npm run build
echo "[diag] build complete, dist listing:"; ls -1 dist || true