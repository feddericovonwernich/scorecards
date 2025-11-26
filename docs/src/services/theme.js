/**
 * Theme Management
 * Handles light/dark mode with OS preference detection and localStorage persistence
 */

const THEME_KEY = 'theme';
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

/**
 * Detect the user's OS-level dark mode preference
 * @returns {string} 'dark' or 'light'
 */
function getOSPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return THEMES.DARK;
    }
    return THEMES.LIGHT;
}

/**
 * Get the saved theme from localStorage or fall back to OS preference
 * @returns {string} 'dark' or 'light'
 */
function getSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === THEMES.DARK || saved === THEMES.LIGHT) {
        return saved;
    }
    return getOSPreference();
}

/**
 * Apply the theme to the document
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Save the theme preference to localStorage
 * @param {string} theme - 'dark' or 'light'
 */
function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}

/**
 * Get the current active theme
 * @returns {string} 'dark' or 'light'
 */
export function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;
}

/**
 * Initialize the theme system
 * Loads saved preference or detects OS preference, then applies the theme
 * Should be called early in app initialization to prevent flash
 */
export function initTheme() {
    const theme = getSavedTheme();
    applyTheme(theme);

    // Listen for OS preference changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const saved = localStorage.getItem(THEME_KEY);
            if (!saved) {
                const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
                applyTheme(newTheme);
            }
        });
    }
}

/**
 * Toggle between light and dark themes
 * Saves the new preference to localStorage
 * @returns {string} The new active theme
 */
export function toggleTheme() {
    const current = getCurrentTheme();
    const newTheme = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    applyTheme(newTheme);
    saveTheme(newTheme);
    return newTheme;
}

/**
 * Set a specific theme
 * @param {string} theme - 'dark' or 'light'
 */
export function setTheme(theme) {
    if (theme === THEMES.DARK || theme === THEMES.LIGHT) {
        applyTheme(theme);
        saveTheme(theme);
    }
}
