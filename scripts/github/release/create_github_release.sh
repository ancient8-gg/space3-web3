TAG=$(git describe --tags --abbrev=0)
git push origin $TAG

PRERELEASE_FLAG=false
[[ $BRANCH = "canary" ]] && PRERELEASE_FLAG=true

gh release create "$TAG" \
  --verify-tag \
  --repo="$GITHUB_REPOSITORY" \
  --title="${TAG}" \
  --prerelease=$PRERELEASE_FLAG \
  --generate-notes
