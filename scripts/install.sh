#!/bin/bash
set -e

# Scorecards Installation Script
# This script sets up a new scorecards instance in your GitHub organization or account
#
# Usage (remote):
#   export GITHUB_TOKEN=your_personal_access_token
#   curl -fsSL https://raw.githubusercontent.com/feddericovonwernich/scorecards/main/scripts/install.sh | bash
#
# Usage (local):
#   export GITHUB_TOKEN=your_personal_access_token
#   bash scripts/install.sh
#
# Environment variables:
#   GITHUB_TOKEN           - Required: GitHub PAT with repo and workflow permissions
#   SCORECARDS_SOURCE_REPO - Optional: Override the template repository URL
#                            (defaults to https://github.com/feddericovonwernich/scorecards.git)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Template repository
TEMPLATE_REPO="https://github.com/ossf/scorecards"

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Step 1: Check prerequisites
print_header "Step 1: Checking Prerequisites"

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is not installed"
        echo "Please install $1 and try again."
        echo "Installation instructions: $2"
        exit 1
    fi
    print_success "$1 is installed"
}

check_command "git" "https://git-scm.com/downloads"
check_command "gh" "https://cli.github.com/"
check_command "jq" "https://stedolan.github.io/jq/download/"

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    print_error "GITHUB_TOKEN environment variable is not set"
    echo ""
    echo "Please set your GitHub Personal Access Token:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo ""
    echo "The token needs the following permissions:"
    echo "  - repo (full control of private repositories)"
    echo "  - workflow (update GitHub Actions workflows)"
    echo ""
    echo "Create a token at: https://github.com/settings/tokens/new"
    exit 1
fi
print_success "GITHUB_TOKEN is set"

# Validate token
print_info "Validating GitHub token..."
if ! gh auth status &> /dev/null; then
    print_error "GitHub token is invalid or expired"
    echo "Please check your GITHUB_TOKEN and try again."
    exit 1
fi
print_success "GitHub token is valid"

# Get authenticated user
GITHUB_USER=$(gh api user -q .login)
print_success "Authenticated as: $GITHUB_USER"

# Step 2: Interactive setup
print_header "Step 2: Repository Setup"

echo "Enter the repository name for your scorecards instance."
echo "Format: 'org/repo' or just 'repo' (for personal account)"
echo ""
read -p "Repository: " REPO_INPUT

# Parse org/repo
if [[ "$REPO_INPUT" == *"/"* ]]; then
    REPO_OWNER=$(echo "$REPO_INPUT" | cut -d'/' -f1)
    REPO_NAME=$(echo "$REPO_INPUT" | cut -d'/' -f2)
else
    REPO_OWNER="$GITHUB_USER"
    REPO_NAME="$REPO_INPUT"
fi

FULL_REPO="$REPO_OWNER/$REPO_NAME"
print_info "Target repository: $FULL_REPO"

# Confirm with user
echo ""
read -p "Is this correct? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Installation cancelled"
    exit 1
fi

# Step 3: Check if repository exists
print_header "Step 3: Repository Validation"

print_info "Checking if repository exists..."
if gh repo view "$FULL_REPO" &> /dev/null; then
    print_warning "Repository $FULL_REPO already exists"
    echo ""
    read -p "Do you want to use this existing repository? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Installation cancelled"
        exit 1
    fi
    REPO_EXISTS=true
else
    print_info "Repository does not exist. Creating it..."
    echo ""
    read -p "Should this be a private repository? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        VISIBILITY="--private"
    else
        VISIBILITY="--public"
    fi

    # Create repository
    if [ "$REPO_OWNER" = "$GITHUB_USER" ]; then
        gh repo create "$REPO_NAME" $VISIBILITY --confirm
    else
        gh repo create "$FULL_REPO" $VISIBILITY --confirm
    fi
    print_success "Repository created: $FULL_REPO"
    REPO_EXISTS=false
fi

# Step 4: Clone and setup
print_header "Step 4: Setting Up Scorecards"

TEMP_DIR=$(mktemp -d)
print_info "Working directory: $TEMP_DIR"

cleanup() {
    print_info "Cleaning up temporary directory..."
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

cd "$TEMP_DIR"

# Determine source repository
if [ -n "$SCORECARDS_SOURCE_REPO" ]; then
    SOURCE_REPO="$SCORECARDS_SOURCE_REPO"
    print_info "Using specified source repository: $SOURCE_REPO"
else
    # Try to detect if we're running from a local clone
    SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
    if [ -d "$SCRIPT_DIR/../.git" ]; then
        SOURCE_REPO="$SCRIPT_DIR/.."
        print_info "Using local repository as source"
    else
        # Default to the official scorecards template repository
        SOURCE_REPO="https://github.com/feddericovonwernich/scorecards.git"
        print_info "Using official scorecards template: $SOURCE_REPO"
    fi
fi

# Clone the template
print_info "Cloning scorecards template..."
if [[ "$SOURCE_REPO" == http* ]] || [[ "$SOURCE_REPO" == git@* ]]; then
    git clone --quiet "$SOURCE_REPO" scorecards
    cd scorecards
else
    # Local repository
    cp -r "$SOURCE_REPO" scorecards
    cd scorecards
    # Ensure we're on main branch
    git checkout main 2>/dev/null || git checkout -b main
fi
print_success "Template cloned"

# Configure git
git config user.name "Scorecards Bot"
git config user.email "scorecards-bot@users.noreply.github.com"

# Step 5: Create catalog branch
print_header "Step 5: Creating Catalog Branch"

print_info "Creating catalog branch..."

# Create orphan catalog branch
git checkout --orphan catalog

# Remove all files from staging
git rm -rf . > /dev/null 2>&1

# Copy catalog UI from main
git checkout main -- docs/ 2>/dev/null || {
    print_error "Failed to checkout catalog UI from main branch"
    exit 1
}

# Copy other necessary files
git checkout main -- README.md .gitignore 2>/dev/null || true
git checkout main -- .claude/ 2>/dev/null || true
git checkout main -- scripts/ 2>/dev/null || true

# Copy consolidate-registry workflow (must run from catalog branch)
git checkout main -- .github/workflows/consolidate-registry.yml 2>/dev/null || true

# Create data directories
mkdir -p results badges registry

# Initialize registry
echo '[]' > registry/services.json

# Create README files for each directory
cat > results/README.md << 'EOF'
# Service Results

This directory contains scorecard results for each service.

## Structure

```
results/
└── <org>/
    └── <repo>/
        └── results.json
```

Each `results.json` file contains:
- Service metadata (name, organization, repository URL)
- Timestamp of last check
- Individual check results (pass/fail, details)
- Overall score and rank

These files are automatically generated and updated by the scorecard action running in service repositories.
EOF

cat > badges/README.md << 'EOF'
# Badges

This directory contains badge JSON files for shields.io integration.

## Structure

```
badges/
└── <org>/
    └── <repo>/
        ├── score.json
        └── rank.json
```

Each badge JSON file follows the shields.io endpoint schema:
- `score.json`: Displays the numerical score (0-100)
- `rank.json`: Displays the rank (bronze, silver, gold, platinum)

Services can embed these badges in their README files using:
```markdown
![Scorecard](https://img.shields.io/endpoint?url=https://YOUR_ORG.github.io/scorecards/badges/ORG/REPO/score.json)
![Rank](https://img.shields.io/endpoint?url=https://YOUR_ORG.github.io/scorecards/badges/ORG/REPO/rank.json)
```
EOF

cat > registry/README.md << 'EOF'
# Service Registry

This directory contains the master registry of all services using the scorecard system.

## services.json

The `services.json` file maintains a list of all registered services with their metadata:

```json
[
  {
    "name": "service-name",
    "org": "organization",
    "repo": "repository-name",
    "url": "https://github.com/org/repo",
    "score": 85,
    "rank": "gold",
    "lastUpdated": "2025-11-13T10:30:00Z"
  }
]
```

This file is automatically updated by the scorecard action when services run their checks.
EOF

# Update README to explain catalog branch purpose
cat > README.md << 'EOF'
# Scorecards - Catalog Branch

This is the **catalog branch** of the scorecards system. It serves as the data storage and GitHub Pages hosting branch.

## Purpose

- **Data Storage**: Stores scorecard results, badges, and service registry
- **GitHub Pages**: Hosts the web-based catalog interface
- **No System Code**: Does not contain action code or check definitions (those are on the main branch)

## Structure

- `/docs/` - Catalog web interface (synced from main branch)
- `/results/` - Service scorecard results
- `/badges/` - Badge JSON files for shields.io
- `/registry/` - Service registry and metadata

## Automated Updates

This branch is automatically updated by:
1. Service repositories running the scorecard action
2. The docs sync workflow (keeps documentation current)

**Do not manually edit files in this branch** - they are maintained by automation.

## Main Branch

For system code, check definitions, and development, see the `main` branch.
EOF

# Commit catalog structure
git add .
git commit -m "Initialize catalog branch

- Set up data directories (results, badges, registry)
- Initialize empty service registry
- Copy documentation from main branch
- Add README files explaining directory purposes

This catalog branch serves as the GitHub Pages source and data storage
for the distributed scorecards system."

print_success "Catalog branch created"

# Step 6: Push to target repository
print_header "Step 6: Pushing to GitHub"

# Add target repository as remote
REPO_URL="https://github.com/$FULL_REPO.git"
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# Configure git to use the token
git config credential.helper store
echo "https://$GITHUB_TOKEN@github.com" | git credential approve

print_info "Pushing main branch..."
git checkout main
git branch -M main
if ! git push -u origin main --force; then
    print_error "Failed to push main branch"
    exit 1
fi
print_success "Main branch pushed"

print_info "Pushing catalog branch..."
if ! git push -u origin catalog --force; then
    print_error "Failed to push catalog branch"
    exit 1
fi
print_success "Catalog branch pushed"

# Step 7: Customize documentation for target repository
print_header "Step 7: Customizing Documentation"

print_info "Customizing documentation to reference $FULL_REPO..."

# Create a new temp directory for customization
CUSTOMIZE_DIR=$(mktemp -d)
cd "$CUSTOMIZE_DIR"

# Clone the target repository
print_info "Cloning target repository..."
git clone --quiet "https://$GITHUB_TOKEN@github.com/$FULL_REPO.git" repo
cd repo

# Configure git
git config user.name "Scorecards Bot"
git config user.email "scorecards-bot@users.noreply.github.com"

# Function to replace repository references in files
customize_docs() {
    local branch=$1
    print_info "Customizing $branch branch..."

    git checkout "$branch" > /dev/null 2>&1

    # Find all files except install.sh and replace repository references
    find . -type f \( -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.html" -o -name "*.js" \) \
        ! -path "*/scripts/install.sh" \
        ! -path "*/.git/*" \
        -print0 | while IFS= read -r -d '' file; do
        # Use a temporary file for cross-platform sed compatibility
        # Replace repository references
        sed "s|feddericovonwernich/scorecards|$FULL_REPO|g" "$file" > "$file.tmp" && mv "$file.tmp" "$file"
        # Replace GitHub Pages URLs
        sed "s|feddericovonwernich\\.github\\.io/scorecards|$REPO_OWNER.github.io/$REPO_NAME|g" "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    done

    # Check if there are any changes
    if ! git diff --quiet; then
        git add .
        git commit -m "Customize documentation for $FULL_REPO

- Update repository references from feddericovonwernich/scorecards to $FULL_REPO
- Update GitHub Pages URLs to $REPO_OWNER.github.io/$REPO_NAME
- Keep installation script pointing to source repository"
        git push origin "$branch"
        print_success "Customized $branch branch"
    else
        print_info "No changes needed for $branch branch"
    fi
}

# Customize both branches
customize_docs "main"
customize_docs "catalog"

# Clean up customization directory
cd "$TEMP_DIR"
rm -rf "$CUSTOMIZE_DIR"

print_success "Documentation customized for $FULL_REPO"

# Step 8: Configure GitHub Pages
print_header "Step 8: Configuring GitHub Pages"

print_info "Enabling GitHub Pages on catalog branch..."

# Enable Pages using GitHub API
gh api -X POST "/repos/$FULL_REPO/pages" \
    -f source[branch]=catalog \
    -f source[path]=/docs \
    2>/dev/null || {
    print_warning "Pages might already be configured, attempting to update..."
    gh api -X PUT "/repos/$FULL_REPO/pages" \
        -f source[branch]=catalog \
        -f source[path]=/docs \
        2>/dev/null || print_warning "Could not configure Pages via API (might need manual setup)"
}

print_success "GitHub Pages configured"

# Get Pages URL
PAGES_URL="https://$REPO_OWNER.github.io/$REPO_NAME"
print_info "Pages URL: $PAGES_URL"
print_warning "Note: It may take a few minutes for Pages to deploy"

# Step 9: Success message
print_header "Installation Complete!"

cat << EOF

${GREEN}✓${NC} Scorecards system successfully installed to ${BLUE}$FULL_REPO${NC}

${YELLOW}Next Steps:${NC}

${BLUE}1. View your catalog:${NC}
   $PAGES_URL

${BLUE}2. Add scorecards to your services:${NC}
   Create a workflow file in each service repository (.github/workflows/scorecards.yml):

   ${YELLOW}name: Scorecards
   on:
     push:
       branches: [main]

   jobs:
     scorecards:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Run Scorecards
           uses: $FULL_REPO/action@main
           with:
             github-token: \${{ secrets.SCORECARDS_TOKEN }}
             scorecards-repo: '$FULL_REPO'
             scorecards-branch: 'catalog'${NC}

${BLUE}3. Create a Personal Access Token for services:${NC}
   - Go to: https://github.com/settings/tokens/new
   - Name: "Scorecards Bot"
   - Permissions: repo (full control)
   - Add as SCORECARDS_TOKEN secret in each service repository

${BLUE}4. Add badges to service READMEs:${NC}
   ${YELLOW}![Scorecard]($PAGES_URL/badges/ORG/REPO/score.json)
   ![Rank]($PAGES_URL/badges/ORG/REPO/rank.json)${NC}

${GREEN}For more information, see the documentation in your new repository.${NC}

EOF
