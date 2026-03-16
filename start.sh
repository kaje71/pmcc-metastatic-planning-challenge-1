#!/bin/bash
# PalLung Planning Challenge - Development Server Launcher
# Works consistently for both local dev and testing static SharePoint builds

set -e

# Ensure we are in the project root
cd "$(dirname "$0")"

PORT=6124

echo "🚀 Preparing Pal Lung Planning Challenge..."

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    # Kill any background processes this script spawned
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Port cleanup logic
OCCUPIER=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$OCCUPIER" ]; then
    echo "🧹 Port $PORT is occupied by PID(s): $OCCUPIER. Clearing..."
    echo "$OCCUPIER" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install
fi

# Run the dev server
echo "🌐 Starting server at http://localhost:$PORT"
echo "   Press Ctrl+C to stop"
echo ""
npm run dev
