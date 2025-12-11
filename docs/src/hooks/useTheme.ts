import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'theme';
const THEMES = { LIGHT: 'light', DARK: 'dark' } as const;

type Theme = typeof THEMES[keyof typeof THEMES];

function getOSPreference(): Theme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEMES.DARK;
  }
  return THEMES.LIGHT;
}

function getSavedTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === THEMES.DARK || saved === THEMES.LIGHT) {
    return saved;
  }
  return getOSPreference();
}

function applyThemeToDOM(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  useEffect(() => {
    // Listen for OS preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const saved = localStorage.getItem(THEME_KEY);
        if (!saved) {
          const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
          setTheme(newTheme);
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const newTheme = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      localStorage.setItem(THEME_KEY, newTheme);
      return newTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
