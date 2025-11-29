/**
 * CSS Utilities
 * Helper functions for CSS variable access in JavaScript
 */

/**
 * Get computed CSS variable value
 * @param {string} varName - CSS variable name (e.g., '--color-success' or 'color-success')
 * @returns {string} Computed CSS variable value
 */
export function getCssVar(varName) {
    // Normalize variable name (add -- prefix if not present)
    const normalizedName = varName.startsWith('--') ? varName : `--${varName}`;
    return getComputedStyle(document.documentElement)
        .getPropertyValue(normalizedName)
        .trim();
}

/**
 * Set a CSS variable value
 * @param {string} varName - CSS variable name (e.g., '--color-success' or 'color-success')
 * @param {string} value - Value to set
 */
export function setCssVar(varName, value) {
    const normalizedName = varName.startsWith('--') ? varName : `--${varName}`;
    document.documentElement.style.setProperty(normalizedName, value);
}
