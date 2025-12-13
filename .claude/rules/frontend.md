---
description: Frontend code guidelines for docs/src/**
globs: docs/src/**/*.{ts,tsx}
---

# Frontend Code Guidelines

## Technology Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Zustand | State management |
| React Router | Client-side routing |

## Configuration Files

Config files in `docs/src/config/`:

| File | Purpose |
|------|---------|
| `constants.ts` | Timing, API params, storage keys |
| `deployment.ts` | Repo owner, API version, ports |
| `scoring.ts` | Rank thresholds, colors |
| `workflows.ts` | Workflow filenames, polling |
| `icons.ts` | SVG icon definitions |

### Usage Examples

```typescript
// Constants
import { TIMING, API_CONFIG, STORAGE_KEYS } from '../config/constants';
setTimeout(callback, TIMING.BUTTON_FEEDBACK);

// Deployment
import { DEPLOYMENT } from '../config/deployment';
const owner = DEPLOYMENT.repoOwner;
const apiVersion = DEPLOYMENT.api.version;

// Scoring
import { SCORING, getRankForScore } from '../config/scoring';
const rank = getRankForScore(85);

// Workflows
import { WORKFLOWS, getWorkflowDispatchUrl } from '../config/workflows';
const url = getWorkflowDispatchUrl(owner, repo, WORKFLOWS.files.triggerService);

// Icons
import { getIcon } from '../config/icons';
const html = `<button>${getIcon('github')} View</button>`;
```

## CSS Variables

Never hardcode colors. Use CSS variables via `getCssVar()`:

```typescript
import { getCssVar } from '../utils/css';
const color = getCssVar('--color-success');
```

Available variables in `docs/css/base/variables.css`:
- `--color-success`, `--color-error` - Status colors
- `--color-success-btn`, `--color-error-btn` - Button states
- `--color-text-muted`, `--color-text-secondary` - Text colors

## State Management

Use Zustand stores for global state:

```typescript
import { useAppStore } from '../stores/appStore';

function MyComponent() {
  const { services, filters, setFilters } = useAppStore();
  // Component logic
}
```

**Store access outside React components:**
```typescript
import { useAppStore } from '../stores/appStore';
const state = useAppStore.getState();
```

## Component Patterns

### Functional Components

All components are functional with hooks:

```typescript
interface Props {
  service: Service;
  onClick?: () => void;
}

export function ServiceCard({ service, onClick }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  return (/* JSX */);
}
```

### Custom Hooks

Encapsulate reusable logic:

```typescript
import { useDebounce } from '../hooks/useDebounce';
import { useTheme } from '../hooks/useTheme';

const debouncedSearch = useDebounce(searchTerm, 300);
const { theme, toggleTheme } = useTheme();
```

## Shared Utilities

Check `docs/src/utils/` before creating new utilities:

| Utility | Location | Purpose |
|---------|----------|---------|
| `getCssVar(name)` | `utils/css.ts` | Access CSS variables |
| `formatRelativeTime(date)` | `utils/formatting.ts` | Relative timestamps |
| `countByRank(services)` | `utils/statistics.ts` | Count by rank |
| `calculateAverageScore(services)` | `utils/statistics.ts` | Average score |
| `md5(string)` | `utils/crypto.ts` | MD5 hashing for Gravatar |

## Module Structure

```
src/
├── components/
│   ├── features/   # Business components (ServiceCard, modals)
│   ├── layout/     # Header, Footer, Navigation
│   ├── ui/         # Reusable primitives (Badge, Modal, Toast)
│   ├── views/      # Page-level components
│   └── containers/ # Data containers
├── stores/         # Zustand state management
├── hooks/          # Custom React hooks
├── api/            # API clients (GitHub, registry)
├── config/         # Constants, configuration
├── services/       # Business logic (auth, staleness)
├── types/          # TypeScript definitions
└── utils/          # Utility functions
```

## Console Logging

ESLint enforces `no-console`. In frontend code:
- Use `console.error()` for errors
- Use `console.warn()` for warnings
- Remove debug `console.log()` before committing

## TypeScript

- All new code must be TypeScript (`.ts` or `.tsx`)
- Define interfaces for component props
- Use strict mode (`"strict": true` in tsconfig)
- Import types with `import type` when possible

## Local Development

```bash
# Start Vite dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

Vite provides hot module replacement (HMR) for fast development iteration.
