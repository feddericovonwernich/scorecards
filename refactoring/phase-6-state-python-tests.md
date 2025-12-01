# Phase 6: State Management & Python Types

**Scope**: Centralized state, Python type hints, comprehensive tests
**Risk**: Medium
**Files**: ~25

## Context

- Global state scattered across `window.*` variables
- Python scripts lack type hints
- Test coverage needs expansion

---

## Tasks

### 6.1 Create State Management

**File**: `docs/src/services/state.js` (NEW)

```javascript
/**
 * Centralized state management
 * Replaces scattered window.* globals
 * @module services/state
 */

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/** @type {import('../types').AppState} */
const state = {
    services: {
        all: [],
        filtered: [],
        loading: false
    },
    filters: {
        active: new Map(),
        search: '',
        sort: 'score-desc'
    },
    auth: {
        pat: null,
        validated: false
    },
    ui: {
        currentModal: null,
        checksHash: null
    }
};

/**
 * Get current state (shallow copy)
 * @returns {import('../types').AppState}
 */
export function getState() {
    return { ...state };
}

/**
 * Get specific state slice
 * @template {keyof import('../types').AppState} K
 * @param {K} key
 * @returns {import('../types').AppState[K]}
 */
export function getStateSlice(key) {
    return state[key];
}

/**
 * Update state and notify listeners
 * @param {Partial<import('../types').AppState>} updates
 */
export function setState(updates) {
    const changedKeys = [];

    for (const [key, value] of Object.entries(updates)) {
        if (state[key] !== value) {
            state[key] = value;
            changedKeys.push(key);
        }
    }

    changedKeys.forEach(key => notifyListeners(key));
}

/**
 * Subscribe to state changes
 * @param {string} key - State key to watch
 * @param {Function} callback - Called on change
 * @returns {Function} Unsubscribe function
 */
export function subscribe(key, callback) {
    if (!listeners.has(key)) {
        listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);

    return () => {
        listeners.get(key)?.delete(callback);
    };
}

/**
 * Notify listeners for a key
 * @param {string} key
 */
function notifyListeners(key) {
    listeners.get(key)?.forEach(callback => {
        try {
            callback(state[key]);
        } catch (error) {
            console.error(`State listener error for ${key}:`, error);
        }
    });
}

// ============= Convenience Methods =============

/**
 * Set all services
 * @param {import('../types').ServiceData[]} services
 */
export function setServices(services) {
    setState({
        services: { ...state.services, all: services }
    });
}

/**
 * Set filtered services
 * @param {import('../types').ServiceData[]} services
 */
export function setFilteredServices(services) {
    setState({
        services: { ...state.services, filtered: services }
    });
}

/**
 * Set GitHub PAT
 * @param {string|null} pat
 * @param {boolean} [validated=false]
 */
export function setAuth(pat, validated = false) {
    setState({
        auth: { pat, validated }
    });
}
```

---

### 6.2 Migrate from window.* to State

Update `docs/app.js` to use state management:

```javascript
import { getState, setState, setServices, subscribe } from './src/services/state.js';

// Replace:
// window.allServices = [];
// With:
setServices([]);

// Replace:
// const services = window.allServices;
// With:
const { services } = getState();
const allServices = services.all;

// Subscribe to changes:
subscribe('services', (services) => {
    renderServiceGrid(services.filtered);
});
```

---

### 6.3 Add Python Type Hints

Update all Python check scripts with type hints.

**File**: `checks/02-license/check.py`

```python
#!/usr/bin/env python3
"""License check - verifies repository has a valid license file."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Optional, TypedDict, List

class CheckResult(TypedDict):
    """Result structure for check output."""
    passed: bool
    message: str
    details: Optional[str]

LICENSE_NAMES: List[str] = [
    'LICENSE', 'LICENSE.txt', 'LICENSE.md',
    'COPYING', 'COPYING.txt'
]

MIN_LICENSE_LENGTH: int = 50


def find_license_file(repo_path: Path) -> Optional[Path]:
    """
    Find license file in repository.

    Args:
        repo_path: Path to repository root

    Returns:
        Path to license file if found, None otherwise
    """
    for name in LICENSE_NAMES:
        license_path = repo_path / name
        if license_path.is_file():
            return license_path
    return None


def read_license_content(license_path: Path) -> str:
    """
    Read license file content safely.

    Args:
        license_path: Path to license file

    Returns:
        File content as string

    Raises:
        UnicodeDecodeError: If file cannot be decoded
    """
    try:
        return license_path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        # Try with latin-1 as fallback
        return license_path.read_text(encoding='latin-1')


def check_license(repo_path: Path) -> CheckResult:
    """
    Run license check on repository.

    Args:
        repo_path: Path to repository root

    Returns:
        CheckResult with pass/fail status and message
    """
    license_file = find_license_file(repo_path)

    if license_file is None:
        return {
            'passed': False,
            'message': 'No LICENSE file found',
            'details': None
        }

    try:
        content = read_license_content(license_file)
    except Exception as e:
        return {
            'passed': False,
            'message': f'Failed to read license file: {e}',
            'details': None
        }

    if len(content.strip()) < MIN_LICENSE_LENGTH:
        return {
            'passed': False,
            'message': f'LICENSE file too short ({len(content)} chars)',
            'details': None
        }

    return {
        'passed': True,
        'message': f'Found {license_file.name}',
        'details': None
    }


def main() -> None:
    """Main entry point."""
    repo_path = Path(os.environ.get('SCORECARD_REPO_PATH', '.'))
    result = check_license(repo_path)

    print(json.dumps(result))
    sys.exit(0 if result['passed'] else 1)


if __name__ == '__main__':
    main()
```

Apply similar pattern to:
- `checks/11-codeowners/check.py`
- Any other Python files

---

### 6.4 Add mypy Configuration

**File**: `pyproject.toml` (update or create)

```toml
[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
check_untyped_defs = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
```

---

### 6.5 Add Accessibility Tests

**File**: `tests/e2e/accessibility.spec.js` (NEW)

```javascript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
    test('dashboard has no critical violations', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.service-card');

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const critical = results.violations.filter(v => v.impact === 'critical');
        expect(critical).toHaveLength(0);
    });

    test('service modal is keyboard navigable', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.service-card');

        // Click first service
        await page.click('.service-card');
        await page.waitForSelector('#service-modal:not(.hidden)');

        const results = await new AxeBuilder({ page })
            .include('#service-modal')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(results.violations).toHaveLength(0);
    });

    test('filter controls are accessible', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.filters');

        const results = await new AxeBuilder({ page })
            .include('.filters')
            .analyze();

        expect(results.violations.filter(v =>
            v.impact === 'critical' || v.impact === 'serious'
        )).toHaveLength(0);
    });
});
```

---

### 6.6 Add Unit Tests for State Management

**File**: `tests/unit/javascript/state.test.js` (NEW)

```javascript
import { describe, test, expect, beforeEach } from 'vitest';
import { getState, setState, subscribe, setServices } from '../../../docs/src/services/state.js';

describe('State Management', () => {
    beforeEach(() => {
        // Reset state between tests
        setState({
            services: { all: [], filtered: [], loading: false },
            filters: { active: new Map(), search: '', sort: 'score-desc' },
            auth: { pat: null, validated: false },
            ui: { currentModal: null, checksHash: null }
        });
    });

    test('getState returns current state', () => {
        const state = getState();
        expect(state.services.all).toEqual([]);
        expect(state.filters.sort).toBe('score-desc');
    });

    test('setState updates state', () => {
        setState({
            filters: { active: new Map(), search: 'test', sort: 'name-asc' }
        });

        const state = getState();
        expect(state.filters.search).toBe('test');
        expect(state.filters.sort).toBe('name-asc');
    });

    test('subscribe receives updates', () => {
        const calls = [];
        const unsubscribe = subscribe('services', (value) => {
            calls.push(value);
        });

        setServices([{ org: 'test', repo: 'repo' }]);

        expect(calls.length).toBe(1);
        expect(calls[0].all[0].org).toBe('test');

        unsubscribe();
    });

    test('unsubscribe stops updates', () => {
        const calls = [];
        const unsubscribe = subscribe('services', (value) => {
            calls.push(value);
        });

        unsubscribe();
        setServices([{ org: 'test', repo: 'repo' }]);

        expect(calls.length).toBe(0);
    });
});
```

---

## Verification

```bash
# Run all JavaScript tests
npm test

# Run Python type checking
mypy checks/

# Run E2E tests including accessibility
npx playwright test

# Run accessibility tests specifically
npx playwright test tests/e2e/accessibility.spec.js

# Full verification
npm run lint && npm test && npx playwright test
```

---

## Files Changed Summary

### New Files
- `docs/src/services/state.js`
- `tests/e2e/accessibility.spec.js`
- `tests/unit/javascript/state.test.js`

### Modified Files
- `docs/app.js` - Use state management
- `checks/02-license/check.py` - Add type hints
- `checks/11-codeowners/check.py` - Add type hints
- `pyproject.toml` - Add mypy config
