/**
 * Theme Management
 * Handles light/dark mode with OS preference detection and localStorage persistence
 */

const THEME_KEY = 'theme';

export type Theme = 'light' | 'dark';

const THEMES: Record<string, Theme> = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

/**
 * Detect the user's OS-level dark mode preference
 */
function getOSPreference(): Theme {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return THEMES.DARK;
  }
  return THEMES.LIGHT;
}

/**
 * Get the saved theme from localStorage or fall back to OS preference
 */
function getSavedTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === THEMES.DARK || saved === THEMES.LIGHT) {
    return saved as Theme;
  }
  return getOSPreference();
}

/**
 * Apply the theme to the document
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Save the theme preference to localStorage
 */
function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Get the current active theme
 */
export function getCurrentTheme(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme) || THEMES.LIGHT;
}

/**
 * Initialize the theme system
 * Loads saved preference or detects OS preference, then applies the theme
 * Should be called early in app initialization to prevent flash
 */
export function initTheme(): void {
  const theme = getSavedTheme();
  applyTheme(theme);

  // Listen for OS preference changes
  if (window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't manually set a preference
        const saved = localStorage.getItem(THEME_KEY);
        if (!saved) {
          const newTheme: Theme = e.matches ? THEMES.DARK : THEMES.LIGHT;
          applyTheme(newTheme);
        }
      });
  }
}

/**
 * Toggle between light and dark themes
 * Saves the new preference to localStorage
 */
export function toggleTheme(): Theme {
  const current = getCurrentTheme();
  const newTheme: Theme = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  applyTheme(newTheme);
  saveTheme(newTheme);
  return newTheme;
}

/**
 * Set a specific theme
 */
export function setTheme(theme: Theme): void {
  if (theme === THEMES.DARK || theme === THEMES.LIGHT) {
    applyTheme(theme);
    saveTheme(theme);
  }
}
