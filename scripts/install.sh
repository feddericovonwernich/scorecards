#!/bin/bash
set -euo pipefail

# Installs a new Scorecards repository from this exact Git checkout.
# Supported target: owner/scorecards. Existing repositories must have no refs and
# require SCORECARDS_ADOPT_EMPTY_REPO=true. Existing installations are never updated.

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
NC=$'\033[0m'
SOURCE_REPOSITORY="https://github.com/feddericovonwernich/scorecards"
INSTALL_POLL_INTERVAL_SECONDS="${INSTALL_POLL_INTERVAL_SECONDS:-5}"
INSTALL_DEPLOY_TIMEOUT_SECONDS="${INSTALL_DEPLOY_TIMEOUT_SECONDS:-900}"

print_header() { printf '\n%b%s%b\n\n' "$BLUE" "$1" "$NC"; }
print_success() { printf '%b✓ %s%b\n' "$GREEN" "$1" "$NC"; }
print_error() { printf '%b✗ %s%b\n' "$RED" "$1" "$NC" >&2; }
print_warning() { printf '%b⚠ %s%b\n' "$YELLOW" "$1" "$NC"; }
print_info() { printf '%bℹ %s%b\n' "$BLUE" "$1" "$NC"; }
fail() { print_error "$1"; exit 1; }

validate_boolean_env() {
    local name="$1"
    local value="${2:-}"
    if [ -n "$value" ] && [ "$value" != true ] && [ "$value" != false ]; then
        fail "$name must be 'true' or 'false', got '$value'"
    fi
}

check_command() {
    command -v "$1" >/dev/null 2>&1 || fail "$1 is required. Install it from $2"
}

gh_with_token() {
    GH_TOKEN="$GITHUB_TOKEN" gh "$@"
}

git_with_gh() {
    GH_TOKEN="$GITHUB_TOKEN" git \
        -c credential.helper= \
        -c credential.helper='!gh auth git-credential' \
        "$@"
}

remote_ref_sha() {
    local repository="$1"
    local ref="$2"
    local line
    line="$(git_with_gh -C "$repository" ls-remote origin "$ref")"
    printf '%s\n' "${line%%[[:space:]]*}"
}

if [ -n "${SCORECARDS_USE_EXISTING+x}" ]; then
    fail "SCORECARDS_USE_EXISTING is no longer supported. Preserve the repository and follow the manual upgrade guide; do not force push or reset it."
fi
validate_boolean_env SCORECARDS_AUTO_CONFIRM "${SCORECARDS_AUTO_CONFIRM:-}"
validate_boolean_env SCORECARDS_REPO_PRIVATE "${SCORECARDS_REPO_PRIVATE:-}"
validate_boolean_env SCORECARDS_ADOPT_EMPTY_REPO "${SCORECARDS_ADOPT_EMPTY_REPO:-}"

if [ -n "${SCORECARDS_TARGET_REPO:-}" ]; then
    REPO_INPUT="$SCORECARDS_TARGET_REPO"
else
    read -r -p "Target repository (owner/scorecards): " REPO_INPUT </dev/tty
fi

if [[ ! "$REPO_INPUT" =~ ^[A-Za-z0-9_-]+/[A-Za-z0-9_-]+$ ]]; then
    fail "SCORECARDS_TARGET_REPO must use the owner/repository form"
fi
REPO_OWNER="${REPO_INPUT%%/*}"
REPO_NAME="${REPO_INPUT##*/}"
FULL_REPO="$REPO_OWNER/$REPO_NAME"
if [ "$REPO_NAME" != scorecards ]; then
    fail "Only a repository named 'scorecards' is supported; '$FULL_REPO' was not changed."
fi

print_header "Step 1: Checking prerequisites"
check_command git https://git-scm.com/downloads
check_command gh https://cli.github.com/
check_command python3 https://www.python.org/downloads/
if [ "${BASH_VERSINFO[0]}" -lt 3 ] || { [ "${BASH_VERSINFO[0]}" -eq 3 ] && [ "${BASH_VERSINFO[1]}" -lt 2 ]; }; then
    fail "Bash 3.2 or newer is required"
fi
GIT_PUSH_HELP="$(git push -h 2>&1 || true)"
grep -q -- 'atomic' <<<"$GIT_PUSH_HELP" || fail "Git must support git push --atomic (Git 2.4+)"
for capability in "api --help" "repo view --help" "repo create --help" "workflow run --help" "run list --help"; do
    # Deliberate word splitting: each capability is a gh command plus --help.
    # shellcheck disable=SC2086
    gh $capability >/dev/null 2>&1 || {
        gh --version >&2 || true
        fail "GitHub CLI lacks required capability: gh $capability"
    }
done
[ -n "${GITHUB_TOKEN:-}" ] || fail "GITHUB_TOKEN is required"
GITHUB_USER="$(gh_with_token api user --jq .login)" || fail "GITHUB_TOKEN is invalid or expired"
[ -n "$GITHUB_USER" ] || fail "GitHub did not return an authenticated user"
OWNER_TYPE="$(gh_with_token api "users/$REPO_OWNER" --jq .type)" || fail "Cannot read target owner '$REPO_OWNER'"
if [ "$OWNER_TYPE" = Organization ]; then
    MEMBERSHIP="$(gh_with_token api "orgs/$REPO_OWNER/memberships/$GITHUB_USER" --jq .state 2>/dev/null || true)"
    [ "$MEMBERSHIP" = active ] || fail "Authenticated user has no visible active membership in $REPO_OWNER"
fi
print_success "Authenticated as $GITHUB_USER"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$SCRIPT_DIR/.."
[ -e "$SOURCE_ROOT/.git" ] || fail "Installer must run from a pinned Scorecards Git checkout; use the versioned bootstrap command."
SOURCE_SHA="$(git -C "$SOURCE_ROOT" rev-parse HEAD^{commit} 2>/dev/null)" || fail "Cannot resolve source checkout HEAD"
[[ "$SOURCE_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "Source checkout did not resolve to a full commit SHA"
if [ -n "${SCORECARDS_SOURCE_SHA:-}" ] && [ "$SCORECARDS_SOURCE_SHA" != "$SOURCE_SHA" ]; then
    fail "Source checkout SHA does not match SCORECARDS_SOURCE_SHA"
fi

TARGET_URL="https://github.com/$FULL_REPO.git"
REPO_EXISTS=false
if gh_with_token repo view "$FULL_REPO" --json name >/dev/null 2>&1; then
    REPO_EXISTS=true
    refs="$(git_with_gh ls-remote "$TARGET_URL" 'refs/heads/*' 'refs/tags/*')" || fail "Cannot inspect refs in existing repository"
    if [ -n "$refs" ]; then
        fail "The installer only creates new installations and never modifies repositories with refs. Preserve '$FULL_REPO' and use the manual upgrade guide; do not force push or reset."
    fi
    [ "${SCORECARDS_ADOPT_EMPTY_REPO:-false}" = true ] || fail "Existing empty repository requires SCORECARDS_ADOPT_EMPTY_REPO=true"

    permissions="$(gh_with_token api "repos/$FULL_REPO" --jq '.permissions | [.push,.admin,.maintain] | @tsv')" || fail "Cannot read repository permissions"
    IFS=$'\t' read -r can_push can_admin can_maintain <<<"$permissions"
    [ "$can_push" = true ] || fail "Token cannot push to $FULL_REPO"
    if [ "$can_admin" != true ] && [ "$can_maintain" != true ]; then
        fail "Token needs admin or maintain access to configure Pages"
    fi
    gh_with_token api "repos/$FULL_REPO/actions/permissions" --jq .enabled >/dev/null || fail "Cannot read Actions settings for $FULL_REPO"
fi

if [ "${SCORECARDS_AUTO_CONFIRM:-false}" != true ]; then
    read -r -p "Install Scorecards to $FULL_REPO? (y/N) " reply </dev/tty
    [[ "$reply" =~ ^[Yy]$ ]] || fail "Installation cancelled"
fi

print_header "Step 2: Preparing immutable installation commits"
WORK_DIR="$(mktemp -d)"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT
INSTALL_REPO="$WORK_DIR/scorecards"
git clone --quiet "$SOURCE_ROOT" "$INSTALL_REPO"
git -C "$INSTALL_REPO" checkout --detach "$SOURCE_SHA" >/dev/null
git -C "$INSTALL_REPO" checkout -B main >/dev/null
git -C "$INSTALL_REPO" config user.name "Scorecards Bot"
git -C "$INSTALL_REPO" config user.email "scorecards-bot@users.noreply.github.com"

while IFS= read -r -d '' file; do
    sed "s|feddericovonwernich/scorecards|$FULL_REPO|g; s|feddericovonwernich\\.github\\.io/scorecards|$REPO_OWNER.github.io/scorecards|g" "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
done < <(find "$INSTALL_REPO" -type f \( -name '*.md' -o -name '*.yml' -o -name '*.yaml' -o -name '*.html' -o -name '*.js' \) ! -path '*/.git/*' ! -path '*/scripts/install.sh' -print0)

cat > "$INSTALL_REPO/.scorecards-install.json" <<EOF
{
  "schema": 1,
  "source_repository": "$SOURCE_REPOSITORY",
  "source_sha": "$SOURCE_SHA"
}
EOF

git -C "$INSTALL_REPO" add -A
git -C "$INSTALL_REPO" commit -m "Install Scorecards from $SOURCE_SHA" >/dev/null
INSTALLED_MAIN_SHA="$(git -C "$INSTALL_REPO" rev-parse refs/heads/main)"

git -C "$INSTALL_REPO" checkout --orphan catalog >/dev/null
git -C "$INSTALL_REPO" rm -rf . >/dev/null 2>&1 || true
for path in docs README.md .gitignore scripts .github/workflows/consolidate-registry.yml; do
    git -C "$INSTALL_REPO" checkout main -- "$path" 2>/dev/null || true
done
mkdir -p "$INSTALL_REPO/results" "$INSTALL_REPO/badges" "$INSTALL_REPO/registry"
printf '%s\n' '[]' > "$INSTALL_REPO/registry/services.json"
cat > "$INSTALL_REPO/registry/all-services.json" <<'EOF'
{
  "services": [],
  "generated_at": null,
  "count": 0
}
EOF
cat > "$INSTALL_REPO/results/README.md" <<'EOF'
# Service Results

Generated service results. Do not edit by hand.
EOF
cat > "$INSTALL_REPO/badges/README.md" <<'EOF'
# Badges

Generated badge data. Do not edit by hand.
EOF
cat > "$INSTALL_REPO/registry/README.md" <<'EOF'
# Service Registry

Generated service registry entries. Do not edit by hand.
EOF
cat > "$INSTALL_REPO/README.md" <<'EOF'
# Scorecards catalog branch

Generated catalog data and compiled UI assets. System source remains on `main`.
EOF
git -C "$INSTALL_REPO" add -A
git -C "$INSTALL_REPO" commit -m "Initialize Scorecards catalog" >/dev/null
CATALOG_SHA="$(git -C "$INSTALL_REPO" rev-parse refs/heads/catalog)"
git -C "$INSTALL_REPO" checkout main >/dev/null
print_success "Prepared source $SOURCE_SHA as installed main $INSTALLED_MAIN_SHA"

print_header "Step 3: Publishing both branches atomically"
if [ "$REPO_EXISTS" = false ]; then
    visibility=--public
    [ "${SCORECARDS_REPO_PRIVATE:-false}" != true ] || visibility=--private
    print_warning "Repository creation is the first remote write; GitHub cannot fully preflight owner policy, workflow, or Pages permissions."
    gh_with_token repo create "$FULL_REPO" "$visibility" || fail "Repository creation failed; no refs were published"
fi

git -C "$INSTALL_REPO" remote remove origin 2>/dev/null || true
git -C "$INSTALL_REPO" remote add origin "$TARGET_URL"
if ! git_with_gh -C "$INSTALL_REPO" push --atomic origin \
    refs/heads/main:refs/heads/main \
    refs/heads/catalog:refs/heads/catalog; then
    fail "Atomic publication failed. No branch should be present; if the repository is empty, retry with SCORECARDS_ADOPT_EMPTY_REPO=true."
fi
[ "$(remote_ref_sha "$INSTALL_REPO" refs/heads/main)" = "$INSTALLED_MAIN_SHA" ] || fail "Published main SHA does not match the prepared installation"
[ "$(remote_ref_sha "$INSTALL_REPO" refs/heads/catalog)" = "$CATALOG_SHA" ] || fail "Published catalog SHA does not match the prepared installation"
print_success "Published main and catalog in one atomic push"

print_header "Step 4: Deploying GitHub Pages"
default_branch="$(gh_with_token api "repos/$FULL_REPO" --jq .default_branch 2>/dev/null || true)"
if [ "$default_branch" != main ]; then
    printf '%s\n' '{"default_branch":"main"}' | gh_with_token api --method PATCH "repos/$FULL_REPO" --input - >/dev/null || fail "Branches are published, but setting default branch to main failed"
fi

pages="$(gh_with_token api "repos/$FULL_REPO/pages" --jq '[.build_type,.status,.html_url] | @tsv' 2>/dev/null || true)"
if [ -z "$pages" ]; then
    printf '%s\n' '{"build_type":"workflow"}' | gh_with_token api --method POST "repos/$FULL_REPO/pages" --input - >/dev/null || fail "Branches are published, but creating workflow-based Pages failed"
else
    IFS=$'\t' read -r build_type _ _ <<<"$pages"
    if [ "$build_type" != workflow ]; then
        printf '%s\n' '{"build_type":"workflow"}' | gh_with_token api --method PUT "repos/$FULL_REPO/pages" --input - >/dev/null || fail "Branches are published, but changing Pages to workflow mode failed"
    fi
fi

DISPATCH_REQUESTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
gh_with_token workflow run sync-docs.yml --repo "$FULL_REPO" --ref main || fail "Pages is configured, but dispatching sync-docs.yml failed"

deadline=$((SECONDS + INSTALL_DEPLOY_TIMEOUT_SECONDS))
run_url=
run_conclusion=
while [ "$SECONDS" -le "$deadline" ]; do
    run_rows="$(gh_with_token api --method GET --paginate --slurp \
        "repos/$FULL_REPO/actions/workflows/sync-docs.yml/runs" \
        -f event=workflow_dispatch \
        -f branch=main \
        -f head_sha="$INSTALLED_MAIN_SHA" \
        -f "created=>=$DISPATCH_REQUESTED_AT" \
        -F per_page=100 \
        --jq '.[].workflow_runs[] | [.id,.status,(.conclusion // "pending"),.html_url,.head_sha,.created_at] | @tsv')" || fail "Cannot query the dispatched Pages workflow"

    candidates=()
    while IFS= read -r row; do
        [ -n "$row" ] && candidates[${#candidates[@]}]="$row"
    done <<<"$run_rows"

    if [ "${#candidates[@]}" -gt 1 ]; then
        fail "Ambiguous fresh sync-docs.yml runs for installed main $INSTALLED_MAIN_SHA; refusing to guess"
    fi
    if [ "${#candidates[@]}" -eq 1 ]; then
        IFS=$'\t' read -r run_id run_status run_conclusion run_url run_head_sha run_created_at <<<"${candidates[0]}"
        if [ "$run_head_sha" != "$INSTALLED_MAIN_SHA" ] || [[ "$run_created_at" < "$DISPATCH_REQUESTED_AT" ]]; then
            fail "Workflow query returned a stale or unrelated deployment"
        fi
        if [ "$run_status" = completed ]; then
            [ "$run_conclusion" = success ] || fail "Pages workflow $run_url concluded $run_conclusion. Preserve refs and logs; fix forward and dispatch main again."
            break
        fi
    fi
    sleep "$INSTALL_POLL_INTERVAL_SECONDS"
done
[ "$run_conclusion" = success ] || fail "Timed out waiting for the fresh Pages deployment. Preserve refs and retry only the Pages dispatch."

pages="$(gh_with_token api "repos/$FULL_REPO/pages" --jq '[.build_type,.status,.html_url] | @tsv')" || fail "Deployment succeeded, but final Pages state is unreadable"
IFS=$'\t' read -r build_type pages_status pages_url <<<"$pages"
[ "$build_type" = workflow ] || fail "Pages is not in workflow build mode"
[ "$pages_status" != errored ] || fail "Pages reports an errored deployment"

print_info "Verifying deployed HTML and compiled assets at $pages_url"
if ! python3 - "$pages_url" "$((deadline - SECONDS))" "$INSTALL_POLL_INTERVAL_SECONDS" <<'PY'
import re
import signal
import sys
import time
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

url, timeout, interval = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
last_error = "deployment deadline expired before asset verification"

def expired(*_):
    raise SystemExit(f"Pages delivery verification timed out: {last_error}")

if timeout <= 0:
    expired()
signal.signal(signal.SIGALRM, expired)
signal.alarm(timeout)

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = set()
        self.module_script = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("type") == "module" and attrs.get("src"):
            self.module_script = True
            self.references.add((attrs["src"], "js"))
        if tag == "link" and "stylesheet" in attrs.get("rel", "").split() and attrs.get("href"):
            self.references.add((attrs["href"], "css"))
        if tag == "link" and "modulepreload" in attrs.get("rel", "").split() and attrs.get("href"):
            self.references.add((attrs["href"], "js"))

def fetch(address, kind):
    request = Request(address, headers={"Cache-Control": "no-cache"})
    with urlopen(request, timeout=timeout) as response:
        content_type = response.headers.get_content_type()
        content = response.read()
        final_url = response.url
    allowed = {"html": {"text/html"}, "js": {"application/javascript", "text/javascript"}, "css": {"text/css"}}
    if content_type not in allowed[kind] or not content.strip():
        raise ValueError(f"{address}: empty or unexpected {content_type} response")
    if kind != "html" and content.lstrip().startswith(b"<"):
        raise ValueError(f"{address}: HTML returned instead of compiled {kind}")
    return content, final_url

while True:
    try:
        html, document_url = fetch(url, "html")
        assets = Assets()
        assets.feed(html.decode("utf-8"))
        if not assets.module_script:
            raise ValueError("deployed HTML has no compiled module script")
        compiled = {
            (urljoin(document_url, reference), kind)
            for reference, kind in assets.references
            if urlsplit(urljoin(document_url, reference)).netloc == urlsplit(document_url).netloc
        }
        if {kind for _, kind in compiled} != {"js", "css"}:
            raise ValueError("deployed HTML is missing compiled JavaScript or stylesheets")
        for address, kind in sorted(compiled):
            path = urlsplit(address).path
            if not re.search(r"/assets/[^/]+-[A-Za-z0-9_-]{8,}\." + kind + r"$", path):
                raise ValueError(f"deployed HTML references an unhashed {kind} asset: {address}")
            fetch(address, kind)
        print(f"Verified deployed HTML and {len(compiled)} compiled assets")
        break
    except (OSError, ValueError) as error:
        last_error = str(error)
        print(f"Waiting for Pages delivery: {last_error}", file=sys.stderr)
        time.sleep(interval)
PY
then
    fail "Deployed HTML or compiled assets could not be verified at $pages_url. Preserve refs and $run_url logs; fix forward on main and dispatch sync-docs.yml again."
fi

print_header "Installation Complete"
printf '%s\n' \
    "sourceSha: $SOURCE_SHA" \
    "installedMainSha: $INSTALLED_MAIN_SHA" \
    "catalogSha: $CATALOG_SHA" \
    "runUrl: $run_url" \
    "conclusion: $run_conclusion" \
    "buildType: $build_type" \
    "pagesUrl: $pages_url"
printf '\nNext: follow documentation/guides/service-installation.md and verify the first service in the consolidated registry and a fresh browser.\n'
