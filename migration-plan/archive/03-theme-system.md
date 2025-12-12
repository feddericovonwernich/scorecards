# Phase 3: Theme System Migration

## Objective

Migrate the theme management system from vanilla DOM manipulation to React Context, while keeping the critical theme flash prevention script in HTML.

## Current State Analysis

### File: `docs/src/services/theme.ts`

```typescript
// Current implementation uses:
document.documentElement.setAttribute('data-theme', theme)
document.documentElement.getAttribute('data-theme')
localStorage.getItem(THEME_KEY) / localStorage.setItem(THEME_KEY, theme)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)
```

### Theme Usage Locations

1. **`docs/index.html`** (lines 12-21): Inline script for flash prevention
2. **`docs/src/services/theme.ts`**: Theme service module
3. **`docs/src/app-init.ts`**: Calls `initTheme()` and `updateThemeIcon()`
4. **`docs/src/main.ts`**: Exports theme functions to window
5. **`docs/src/components/layout/Header.tsx`**: Has theme toggle button
6. **`docs/src/components/layout/FloatingControls.tsx`**: May have theme toggle
7. **`docs/api-explorer.html`**: Duplicate theme implementation (Phase 1 handles this)

## Migration Steps

### Step 1: Create Theme Context

```typescript
// docs/src/contexts/ThemeContext.tsx

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'theme';

function getInitialTheme(): Theme {
  // Check localStorage first
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }

  // Check OS preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize from what's already set on document (by flash prevention script)
  const [theme, setThemeState] = useState<Theme>(() => {
    const current = document.documentElement.getAttribute('data-theme');
    return (current === 'dark' || current === 'light') ? current : getInitialTheme();
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Listen for OS preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set preference
      const saved = localStorage.getItem(THEME_KEY);
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  // Sync document attribute when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export for non-React code (use sparingly)
export function getCurrentThemeValue(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}
```

### Step 2: Create Theme Hook (Alternative to Context)

For simpler cases or when Context is not needed:

```typescript
// docs/src/hooks/useTheme.ts

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
const THEME_KEY = 'theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const current = document.documentElement.getAttribute('data-theme');
    return (current === 'dark' || current === 'light') ? current : 'light';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Sync with document changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { theme, setTheme, toggleTheme };
}
```

### Step 3: Wrap App with ThemeProvider

Update `docs/src/components/index.tsx`:

```typescript
// Add import
import { ThemeProvider } from '../contexts/ThemeContext';

// Wrap App component
root.render(
  <StrictMode>
    <ThemeProvider>
      <App
        servicesGrid={servicesGridEl}
        teamsGrid={teamsGridEl}
        header={headerEl}
        footer={footerEl}
        navigation={navigationEl}
        floatingControls={floatingControlsEl}
      />
    </ThemeProvider>
  </StrictMode>
);
```

### Step 4: Update Header Component

```typescript
// docs/src/components/layout/Header.tsx

import { useTheme } from '../../contexts/ThemeContext';
// or
import { useTheme } from '../../hooks/useTheme';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      {/* ... other header content ... */}
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title="Toggle night mode"
        aria-label="Toggle night mode"
      >
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      </button>
    </header>
  );
}
```

### Step 5: Remove Vanilla Theme Service Usage

Update `docs/src/app-init.ts`:

```typescript
// REMOVE these imports:
// import { initTheme, getCurrentTheme } from './services/theme.js';

// REMOVE these calls:
// initTheme();
// updateThemeIcon(getCurrentTheme());

// Theme is now managed by React ThemeProvider
// The flash prevention script in index.html handles initial theme
```

### Step 6: Update main.ts

```typescript
// REMOVE window exports for theme:
// window.initTheme = theme.initTheme;
// window.toggleTheme = theme.toggleTheme;
// window.getCurrentTheme = theme.getCurrentTheme;
// window.setTheme = theme.setTheme;
```

### Step 7: Keep HTML Flash Prevention Script

The inline script in `index.html` (lines 12-21) MUST stay:

```html
<script>
    // Apply theme immediately to prevent flash
    (function() {
        const THEME_KEY = 'theme';
        const savedTheme = localStorage.getItem(THEME_KEY);
        const osPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (osPrefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
    })();
</script>
```

This prevents Flash of Unstyled Content (FOUC) before React hydrates.

### Step 8: Deprecate Theme Service

Mark `docs/src/services/theme.ts` as deprecated:

```typescript
/**
 * @deprecated Use useTheme hook or ThemeContext instead
 * This file will be removed in Phase 8
 */

// Keep for backwards compatibility during migration
export { initTheme, toggleTheme, getCurrentTheme, setTheme };
```

## Verification Checklist

- [ ] Theme persists across page refresh
- [ ] Theme toggle button works in Header
- [ ] Theme toggle button works in FloatingControls (if present)
- [ ] Dark mode styles apply correctly
- [ ] Light mode styles apply correctly
- [ ] No flash of wrong theme on page load
- [ ] OS preference detection works (change OS theme while no localStorage value)
- [ ] Storage sync works (change theme in another tab)
- [ ] React components use hook/context, not vanilla service

## Files Modified

| File | Action |
|------|--------|
| `docs/src/contexts/ThemeContext.tsx` | Create (new) |
| `docs/src/hooks/useTheme.ts` | Create (new) |
| `docs/src/components/index.tsx` | Add ThemeProvider wrapper |
| `docs/src/components/layout/Header.tsx` | Use useTheme hook |
| `docs/src/app-init.ts` | Remove theme init calls |
| `docs/src/main.ts` | Remove window theme exports |
| `docs/src/services/theme.ts` | Mark as deprecated |

## Rollback Instructions

If issues arise:
1. `git checkout HEAD -- docs/src/components/index.tsx`
2. `git checkout HEAD -- docs/src/components/layout/Header.tsx`
3. `git checkout HEAD -- docs/src/app-init.ts`
4. `git checkout HEAD -- docs/src/main.ts`
5. Delete new files: `rm docs/src/contexts/ThemeContext.tsx docs/src/hooks/useTheme.ts`

## Notes for Executing Model

- This phase has NO dependencies on other phases
- Can be executed in parallel with Phase 1 and Phase 2
- The HTML inline script MUST remain - do not try to remove it
- The theme service file remains but is deprecated - Phase 8 removes it
- Test theme switching in both Header and any FloatingControls theme buttons
- Test across page refreshes and in incognito mode
