---
description: Frontend code guidelines for docs/src/**
globs: docs/src/**/*.js
---

# Frontend Code Guidelines

## Configuration Files

Config files in `docs/src/config/`:

| File | Purpose |
|------|---------|
| `constants.js` | Timing, API params, storage keys |
| `deployment.js` | Repo owner, API version, ports |
| `scoring.js` | Rank thresholds, colors |
| `workflows.js` | Workflow filenames, polling |
| `icons.js` | SVG icon definitions |

### Usage Examples

```javascript
// Constants
import { TIMING, API_CONFIG, STORAGE_KEYS } from '../config/constants.js';
setTimeout(callback, TIMING.BUTTON_FEEDBACK);

// Deployment
import { DEPLOYMENT } from '../config/deployment.js';
const owner = DEPLOYMENT.repoOwner;
const apiVersion = DEPLOYMENT.api.version;

// Scoring
import { SCORING, getRankForScore } from '../config/scoring.js';
const rank = getRankForScore(85);

// Workflows
import { WORKFLOWS, getWorkflowDispatchUrl } from '../config/workflows.js';
const url = getWorkflowDispatchUrl(owner, repo, WORKFLOWS.files.triggerService);

// Icons
import { getIcon } from '../config/icons.js';
const html = `<button>${getIcon('github')} View</button>`;
```

## CSS Variables

Never hardcode colors. Use CSS variables via `getCssVar()`:

```javascript
import { getCssVar } from '../utils/css.js';
button.style.background = getCssVar('--color-success');
```

Available variables in `docs/css/base/variables.css`:
- `--color-success`, `--color-error` - Status colors
- `--color-success-btn`, `--color-error-btn` - Button states
- `--color-text-muted`, `--color-text-secondary` - Text colors

## Shared Utilities

Check `docs/src/utils/` before creating new utilities:

| Utility | Location | Purpose |
|---------|----------|---------|
| `getCssVar(name)` | `utils/css.js` | Access CSS variables |
| `startButtonSpin(btn)` | `utils/animation.js` | Loading spinner |
| `stopButtonSpin(btn)` | `utils/animation.js` | Remove spinner |
| `countByRank(services)` | `utils/statistics.js` | Count by rank |
| `calculateAverageScore(services)` | `utils/statistics.js` | Average score |

## Module Structure

- `config/` - Constants, icons, configuration
- `api/` - API integrations (GitHub, registry)
- `ui/` - UI components and rendering
- `services/` - Business logic (auth, theme, staleness)
- `utils/` - Reusable utility functions

## Console Logging

ESLint enforces `no-console`. In frontend code:
- Use `console.error()` for errors
- Use `console.warn()` for warnings
- Remove debug `console.log()` before committing

## Local Development

ES modules cache aggressively:
- Test with fresh browser context (incognito or new tab)
- If caching persists, use a new port
- Kill leftover servers: `pkill -f "python3 -m http.server"`
