#!/bin/bash

echo "Running build"
npm run build

echo "Git add"
git add .

echo "Git commit"
git commit -m "Deploying image cancel fixes to hrd"

echo "Pushing to dev"
git push origin dev

echo "Checking out test"
git checkout test

echo "Merging dev into test"
git merge dev --no-edit

echo "Pushing to test"
git push origin test

echo "Switching back to dev"
git checkout dev

echo "Reset hard"
git reset --hard

echo "Pull latest"
git pull

