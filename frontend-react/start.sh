#!/bin/bash

# NepMart Frontend React - Quick Start Script

echo "================================"
echo "NepMart Frontend React Setup"
echo "================================"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from frontend-react directory"
    exit 1
fi

echo "📦 Dependencies Status:"
npm list --depth=0 2>/dev/null | head -10

echo ""
echo "🚀 Starting development server..."
echo ""
echo "Available at: http://localhost:5173"
echo ""
echo "Routes:"
echo "  Frontend: http://localhost:5173/"
echo "  Admin:    http://localhost:5173/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
