#!/bin/bash
# Deploy to VPS in one command
# Usage: bash deploy-remote.sh

set -e
cd "$(dirname "$0")"

echo "📦 Committing and pushing to GitHub..."
git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "Nothing new to commit."
git push origin main

echo "🚀 Deploying on VPS..."
ssh root@5.189.165.222 "bash /root/deploy.sh"

echo "✅ Deployment complete!"
