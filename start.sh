#!/usr/bin/env bash
set -e

# Check that Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed."
  echo "Download and install it from https://nodejs.org, then re-run this script."
  exit 1
fi

NODE_VERSION=$(node --version)
echo "Node.js $NODE_VERSION detected."

# Install dependencies
echo ""
echo "Installing backend dependencies..."
(cd backend && npm install)

echo ""
echo "Installing frontend dependencies..."
(cd frontend && npm install)

# Start backend in the background
echo ""
echo "Starting backend..."
(cd backend && npm start) &
BACKEND_PID=$!

# Start frontend in the foreground so its output is visible
echo "Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Trap Ctrl+C and kill both processes
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

echo ""
echo "Both servers are running. Press Ctrl+C to stop."
wait $BACKEND_PID $FRONTEND_PID
