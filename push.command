#!/bin/bash
cd "$(dirname "$0")"
git add -A
git status
echo ""
read -p "Commit message: " msg
git commit -m "$msg"
git push
echo ""
echo "Done. Press any key to close."
read -n 1
