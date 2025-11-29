# Scorecards Catalog UI

This directory contains the catalog web UI for viewing scorecard results across all repositories.

## Structure

```
docs/
├── index.html              # Main catalog page
├── api-explorer.html       # API exploration interface
├── app.js                  # Legacy application logic (being phased out)
├── app.js.backup           # Backup of original monolith
├── css/                    # Modular CSS (main.css imports all modules)
│   ├── main.css            # Entry point with @imports
│   ├── base/               # Reset, variables, typography
│   ├── components/         # Buttons, cards, modals, etc.
│   ├── features/           # Stats, controls, teams, etc.
│   ├── layout/             # Container, header, footer
│   └── utilities/          # Animations, helpers, responsive
└── src/                    # ES6 Modules (NEW)
    ├── main.js             # Module orchestration & exports
    ├── api/
    │   ├── github.js       # GitHub API client (~180 lines)
    │   └── registry.js     # Registry data fetching (~220 lines)
    ├── services/
    │   ├── auth.js         # Token management (~80 lines)
    │   └── staleness.js    # Staleness detection (~90 lines)
    ├── ui/
    │   ├── filters.js      # Filtering & sorting (~135 lines)
    │   ├── modals.js       # Modal management (~125 lines)
    │   ├── service-modal.js # Service detail modal
    │   ├── team-modal.js   # Team detail modal (~145 lines)
    │   └── toast.js        # Toast notifications (~65 lines)
    └── utils/
        ├── clipboard.js    # Clipboard operations (~75 lines)
        ├── crypto.js       # MD5 hashing (~170 lines)
        ├── dom.js          # DOM helpers (~120 lines)
        └── formatting.js   # Date/text formatting (~120 lines)
```

## Architecture

### ES6 Module System (Phase 4 Complete)

The catalog now uses a modular ES6 architecture with clear separation of concerns:

**API Layer** (`src/api/`)
- `github.js` - GitHub REST API interactions (workflow triggers, rate limiting)
- `registry.js` - Registry data fetching with hybrid auth (API vs CDN)

**Services Layer** (`src/services/`)
- `auth.js` - GitHub PAT management and validation
- `staleness.js` - Service staleness detection based on checks hash

**UI Layer** (`src/ui/`)
- `filters.js` - Service filtering and sorting logic
- `modals.js` - Modal dialog management
- `service-modal.js` - Service detail modal rendering
- `team-modal.js` - Team detail modal rendering
- `toast.js` - Toast notification system

**Utilities** (`src/utils/`)
- `formatting.js` - Date, time, and text formatting
- `crypto.js` - MD5 hashing for Gravatar
- `clipboard.js` - Copy-to-clipboard functionality
- `dom.js` - DOM manipulation helpers

**Orchestration** (`src/main.js`)
- Imports all modules
- Exports to window for backward compatibility with app.js
- Initializes modal handlers and event listeners

### Module Loading

Modules are loaded via ES6 imports in `index.html`:

```html
<!-- ES6 Modules (loaded first) -->
<script type="module" src="src/main.js"></script>

<!-- Main application (uses modules via window.ScorecardModules) -->
<script src="app.js" defer></script>
```

### Accessing Modules

Modules can be accessed in two ways:

1. **Via window.ScorecardModules** (recommended for new code):
```javascript
const { auth, github, registry } = window.ScorecardModules;
```

2. **Via global functions** (for backward compatibility):
```javascript
showToast('Message', 'success');
const token = getGitHubToken();
```

## Development

The catalog is a static web application served via GitHub Pages.

### Local Development

```bash
# Serve locally
cd docs
python3 -m http.server 8000
# Open http://localhost:8000
```

### Testing Modules

To verify modules load correctly, check the browser console for:
```
✓ ES6 Modules loaded successfully
Available modules: [formatting, crypto, clipboard, dom, toast, modals, filters, registry, github, auth, staleness]
✓ Modal handlers initialized
```

### Deployment

The catalog is automatically deployed to GitHub Pages from the `catalog` branch.

The workflow `.github/workflows/sync-docs.yml` handles synchronization.

## Module Benefits

- **Clear Separation**: API, services, UI, and utilities are isolated
- **Maintainable**: ~12 focused modules (~80-220 lines each) vs 2,622-line monolith
- **Testable**: Pure functions with minimal dependencies
- **Modern**: ES6 import/export with native browser support
- **Backward Compatible**: Existing app.js continues to work during transition

## Next Steps

- Continue extracting complex UI rendering logic from app.js
- Add unit tests for individual modules
- Gradually reduce app.js footprint
- Eventually replace app.js entirely with modular architecture
