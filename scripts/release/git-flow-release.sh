#!/bin/bash
set -e

CURR=$(git branch --show-current)
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[0;37m'

function info() {
  echo -e "${YELLOW}$@${WHITE}"
}

function error() {
  echo -e "${RED}$@"
  exit 1
}

if [[ ! $CURR =~ ^develop$ ]]; then
    error "A release should be created from a develop branch only..."
fi

if [[ ! -z "$(git log origin/develop..origin/"$CURR")" ]]; then
  error "${RED}The source branch must be merged into develop branch before releasing"
fi

# if [[ ! -z "$(git log origin/"$CURR"..origin/master)" ]]; then
#   error "${RED}The source branch must be rebased with the master branch before releasing"
# fi

info "Starting a new release"
npm version minor --tag-version-prefix=''
VERSION=$(node -pe "require('./package.json').version")

info "Creating the release branch: release/v$VERSION"
git checkout -b release/v$VERSION

info "Updating the changelog"
node scripts/release/update-changelog.js

info "Creating release commit"
git add ./CHANGELOG.md
git commit -m "ES-0 | chore: release version $VERSION"

info "Pushing the release branch"
git push origin release/v$VERSION --no-verify

info "Pushing the release tag"
git push origin --tags --no-verify

info "The release process of $VERSION has successfully started!"
info "Go to https://gitlab.com/payrix/microservices/funding/-/pipelines and check the progress"

git checkout develop