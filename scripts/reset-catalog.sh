#!/bin/bash
set -euo pipefail

# Scorecards Catalog Branch Reset Script
# This script resets the catalog branch to a clean state
#
# Usage:
#   bash scripts/reset-catalog.sh           # Interactive mode with prompts
#   bash scripts/reset-catalog.sh --force   # Skip all confirmation prompts
#
# What it does:
#   1. Validates we're in the scorecards repository
#   2. Checks for uncommitted changes (warns but continues)
#   3. Creates a timestamped backup of the current catalog branch
#   4. Resets the catalog branch to clean state with fresh structure
#   5. Pushes the reset branch to remote origin
#
# Safety features:
#   - Creates backup branch before reset
#   - Prompts for confirmation (unless --force)
#   - Validates repository location
#   - Checks for required branches

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
FORCE_MODE=false
if [ "$1" = "--force" ]; then
    FORCE_MODE=true
fi

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

confirm() {
    if [ "$FORCE_MODE" = true ]; then
        return 0
    fi

    local prompt="$1"
    echo -e "${YELLOW}$prompt${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Step 1: Validation checks
print_header "Step 1: Validation Checks"

# Check if we're in the scorecards repository
print_info "Checking if we're in the scorecards repository..."
if [ ! -f "action/entrypoint.sh" ] || [ ! -d "checks" ]; then
    print_error "Not in the scorecards repository root"
    echo "Please run this script from the root of the scorecards repository."
    echo "Expected files: action/entrypoint.sh, checks/"
    exit 1
fi
print_success "Running in scorecards repository"

# Check if main branch exists
print_info "Checking if main branch exists..."
if ! git rev-parse --verify main >/dev/null 2>&1; then
    if ! git rev-parse --verify master >/dev/null 2>&1; then
        print_error "Neither 'main' nor 'master' branch exists"
        echo "The reset script needs the main branch to copy catalog UI files."
        exit 1
    fi
    MAIN_BRANCH="master"
    print_success "Using 'master' as main branch"
else
    MAIN_BRANCH="main"
    print_success "Using 'main' as main branch"
fi

# Check for uncommitted changes
print_info "Checking for uncommitted changes..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes on branch '$CURRENT_BRANCH'"
    if [ "$FORCE_MODE" = false ]; then
        echo "These changes will not affect the catalog reset, but you may want to commit them first."
        echo ""
        if ! confirm "Proceed with uncommitted changes?"; then
            print_error "Reset cancelled"
            exit 1
        fi
    fi
else
    print_success "Working directory is clean"
fi

# Check if catalog branch exists
print_info "Checking if catalog branch exists..."
CATALOG_EXISTS=false
if git rev-parse --verify catalog >/dev/null 2>&1; then
    CATALOG_EXISTS=true
    print_success "Catalog branch exists (will be backed up)"
else
    print_warning "Catalog branch does not exist (will be created)"
fi

# Step 2: Create backup
print_header "Step 2: Creating Backup"

if [ "$CATALOG_EXISTS" = true ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_BRANCH="catalog-backup-$TIMESTAMP"

    print_info "Creating backup branch: $BACKUP_BRANCH"

    # Create backup branch from current catalog
    git branch "$BACKUP_BRANCH" catalog
    print_success "Backup created: $BACKUP_BRANCH"

    # Ask if user wants to push backup to remote
    if [ "$FORCE_MODE" = false ]; then
        echo ""
        read -p "Push backup branch to remote? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Pushing backup to remote..."
            if git push origin "$BACKUP_BRANCH"; then
                print_success "Backup pushed to remote: origin/$BACKUP_BRANCH"
            else
                print_warning "Failed to push backup (continuing anyway)"
            fi
        fi
    fi
else
    print_info "No existing catalog branch to backup"
fi

# Step 3: Confirm reset
print_header "Step 3: Confirm Reset"

if [ "$FORCE_MODE" = false ]; then
    echo -e "${YELLOW}This will completely reset the catalog branch by:${NC}"
    echo "  - Deleting the current catalog branch (locally)"
    echo "  - Creating a fresh catalog branch with clean structure"
    echo "  - Force-pushing to remote origin/catalog"
    echo ""
    if [ "$CATALOG_EXISTS" = true ]; then
        echo -e "${GREEN}Backup available at: $BACKUP_BRANCH${NC}"
    fi
    echo ""
    if ! confirm "Proceed with catalog reset?"; then
        print_error "Reset cancelled"
        exit 1
    fi
fi

# Step 4: Reset catalog branch
print_header "Step 4: Resetting Catalog Branch"

print_info "Creating new catalog branch..."

# Store current branch to return to later
ORIGINAL_BRANCH="$CURRENT_BRANCH"

# Create new orphan catalog branch
git checkout --orphan catalog-new 2>/dev/null

# Remove all files from staging
print_info "Clearing working directory..."
git rm -rf . > /dev/null 2>&1 || true

# Copy catalog UI from main branch
print_info "Copying catalog UI from $MAIN_BRANCH branch..."
if ! git checkout "$MAIN_BRANCH" -- docs/ 2>/dev/null; then
    print_error "Failed to checkout docs/ from $MAIN_BRANCH branch"
    echo "Cleaning up and aborting..."
    git checkout "$ORIGINAL_BRANCH"
    git branch -D catalog-new 2>/dev/null || true
    exit 1
fi

# Copy other necessary files
git checkout "$MAIN_BRANCH" -- README.md .gitignore 2>/dev/null || true
git checkout "$MAIN_BRANCH" -- .claude/ 2>/dev/null || true
git checkout "$MAIN_BRANCH" -- scripts/ 2>/dev/null || true

# Copy consolidate-registry workflow (must run from catalog branch)
git checkout "$MAIN_BRANCH" -- .github/workflows/consolidate-registry.yml 2>/dev/null || true

print_success "Files copied from $MAIN_BRANCH branch"

# Create data directories
print_info "Creating directory structure..."
mkdir -p results badges registry

# Initialize registry
echo '[]' > registry/services.json

# Initialize all-services.json with empty structure
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > registry/all-services.json <<EOF
{
  "services": [],
  "generated_at": "$TIMESTAMP",
  "count": 0
}
EOF

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

print_success "Directory structure created"

# Commit catalog structure
print_info "Committing catalog structure..."
git add .
git commit -m "Reset catalog branch to clean state

- Set up data directories (results, badges, registry)
- Initialize empty service registry
- Copy documentation from $MAIN_BRANCH branch
- Add README files explaining directory purposes

This catalog branch serves as the GitHub Pages source and data storage
for the distributed scorecards system." > /dev/null

print_success "Catalog structure committed"

# Step 5: Replace local catalog branch
print_header "Step 5: Replacing Local Catalog Branch"

if [ "$CATALOG_EXISTS" = true ]; then
    print_info "Deleting old catalog branch..."
    git branch -D catalog
    print_success "Old catalog branch deleted"
fi

print_info "Renaming catalog-new to catalog..."
git branch -m catalog
print_success "Local catalog branch reset complete"

# Step 6: Push to remote
print_header "Step 6: Pushing to Remote"

if [ "$FORCE_MODE" = false ]; then
    echo -e "${YELLOW}Ready to force-push to remote origin/catalog${NC}"
    echo "This will replace the remote catalog branch with the reset version."
    echo ""
    if ! confirm "Force-push to origin/catalog?"; then
        print_warning "Remote push skipped"
        print_info "Local catalog branch has been reset"
        print_info "Run 'git push -f origin catalog' manually when ready"

        # Return to original branch
        git checkout "$ORIGINAL_BRANCH" 2>/dev/null
        exit 0
    fi
fi

print_info "Force-pushing to origin/catalog..."
if git push -f origin catalog; then
    print_success "Remote catalog branch updated"
else
    print_error "Failed to push to remote"
    echo "Local catalog branch has been reset successfully."
    echo "You may need to push manually: git push -f origin catalog"

    # Return to original branch
    git checkout "$ORIGINAL_BRANCH" 2>/dev/null
    exit 1
fi

# Step 7: Return to original branch
print_info "Returning to original branch ($ORIGINAL_BRANCH)..."
git checkout "$ORIGINAL_BRANCH" 2>/dev/null
print_success "Returned to $ORIGINAL_BRANCH"

# Step 8: Success message
print_header "Reset Complete!"

cat << EOF

${GREEN}✓${NC} Catalog branch has been successfully reset

${BLUE}Summary:${NC}
EOF

if [ "$CATALOG_EXISTS" = true ]; then
    echo -e "  ${GREEN}•${NC} Backup created: ${BLUE}$BACKUP_BRANCH${NC}"
fi

cat << EOF
  ${GREEN}•${NC} Local catalog branch: ${GREEN}reset${NC}
  ${GREEN}•${NC} Remote origin/catalog: ${GREEN}updated${NC}
  ${GREEN}•${NC} Current branch: ${BLUE}$ORIGINAL_BRANCH${NC}

${YELLOW}Next Steps:${NC}

  ${BLUE}1.${NC} Service repositories will repopulate the catalog when they run scorecards
  ${BLUE}2.${NC} GitHub Pages will redeploy automatically (may take a few minutes)
  ${BLUE}3.${NC} All existing scorecard data has been cleared
EOF

if [ "$CATALOG_EXISTS" = true ]; then
    echo -e "  ${BLUE}4.${NC} To restore from backup: ${YELLOW}git checkout $BACKUP_BRANCH${NC}"
fi

echo ""
