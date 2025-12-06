/**
 * CSS Utilities
 * Helper functions for CSS variable access and class name merging
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Utility for conditionally joining class names together
 * Used for conditional CSS class application
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Get computed CSS variable value
 */
export function getCssVar(varName: string): string {
  // Normalize variable name (add -- prefix if not present)
  const normalizedName = varName.startsWith('--') ? varName : `--${varName}`;
  return getComputedStyle(document.documentElement)
    .getPropertyValue(normalizedName)
    .trim();
}

/**
 * Set a CSS variable value
 */
export function setCssVar(varName: string, value: string): void {
  const normalizedName = varName.startsWith('--') ? varName : `--${varName}`;
  document.documentElement.style.setProperty(normalizedName, value);
}
