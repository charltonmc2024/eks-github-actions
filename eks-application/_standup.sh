#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# _standup.sh — install deps (if needed), launch Next.js, verify health
# ---------------------------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
HEALTH_URL="http://localhost:${PORT}"
MAX_WAIT_SECONDS="${MAX_WAIT_SECONDS:-60}"
DEV_PID=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { printf '%b\n' "${GREEN}[standup]${NC} $*"; }
warn() { printf '%b\n' "${YELLOW}[standup]${NC} $*"; }
err()  { printf '%b\n' "${RED}[standup]${NC} $*" >&2; }

cleanup() {
  if [[ -n "${DEV_PID}" ]] && kill -0 "${DEV_PID}" 2>/dev/null; then
    warn "Stopping development server (PID ${DEV_PID})..."
    kill "${DEV_PID}" 2>/dev/null || true
    wait "${DEV_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command not found: $1"
    err "Install Node.js 18+ (includes npm), then re-run this script."
    exit 1
  fi
}

dependencies_installed() {
  [[ -d "node_modules" ]] \
    && [[ -f "node_modules/.package-lock.json" || -d "node_modules/next" ]] \
    && [[ -d "node_modules/react" ]] \
    && [[ -d "node_modules/react-dom" ]]
}

verify_dependencies() {
  log "Verifying dependencies..."

  if ! dependencies_installed; then
    err "Dependency verification failed: required packages are missing."
    return 1
  fi

  if ! npm ls --depth=0 >/dev/null 2>&1; then
    warn "npm ls reported issues; checking critical packages individually..."
    local pkg
    for pkg in next react react-dom; do
      if [[ ! -d "node_modules/${pkg}" ]]; then
        err "Missing critical package: ${pkg}"
        return 1
      fi
    done
  fi

  log "Dependencies verified."
  return 0
}

wait_for_health() {
  local elapsed=0
  local code=""

  log "Waiting for project health at ${HEALTH_URL} (up to ${MAX_WAIT_SECONDS}s)..."

  while (( elapsed < MAX_WAIT_SECONDS )); do
    if ! kill -0 "${DEV_PID}" 2>/dev/null; then
      err "Development server exited before becoming healthy."
      return 1
    fi

    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "${HEALTH_URL}" 2>/dev/null || true)"
    if [[ "${code}" =~ ^(200|301|302|307|308)$ ]]; then
      log "Project is healthy (HTTP ${code})."
      return 0
    fi

    sleep 1
    (( elapsed += 1 ))
  done

  err "Health check timed out after ${MAX_WAIT_SECONDS}s (last HTTP code: ${code:-none})."
  return 1
}

# --- Preconditions ---------------------------------------------------------

log "Standing up project in: ${ROOT_DIR}"

require_cmd node
require_cmd npm
require_cmd curl

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if (( NODE_MAJOR < 18 )); then
  err "Node.js 18+ is required (found $(node -v))."
  exit 1
fi

if [[ ! -f "package.json" ]]; then
  err "package.json not found in ${ROOT_DIR}"
  exit 1
fi

# --- Dependencies ----------------------------------------------------------

if dependencies_installed; then
  log "Dependencies already installed."
else
  warn "Dependencies not installed. Running npm install..."
  npm install
fi

if ! verify_dependencies; then
  err "Attempting a clean install..."
  rm -rf node_modules
  npm install
  if ! verify_dependencies; then
    err "Dependencies could not be installed successfully."
    exit 1
  fi
fi

# --- Launch ----------------------------------------------------------------

if curl -s -o /dev/null --max-time 2 "${HEALTH_URL}" 2>/dev/null; then
  warn "Something is already listening on port ${PORT}."
  if curl -s -o /dev/null -w '%{http_code}' --max-time 2 "${HEALTH_URL}" | grep -Eq '^(200|301|302|307|308)$'; then
    log "Existing server at ${HEALTH_URL} is already healthy."
    trap - EXIT INT TERM
    exit 0
  fi
  err "Port ${PORT} is in use but not healthy. Free the port and re-run."
  exit 1
fi

log "Launching development server: npm run dev"
npm run dev &
DEV_PID=$!

if ! wait_for_health; then
  exit 1
fi

log "Project is up at ${HEALTH_URL}"
log "Development server running in background (PID ${DEV_PID})."
log "Press Ctrl+C to stop."

# Keep script attached so Ctrl+C stops the server via trap
trap - EXIT
trap 'cleanup; exit 0' INT TERM
wait "${DEV_PID}"
