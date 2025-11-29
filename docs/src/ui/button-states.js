/**
 * Button State Management
 * Centralized button UI state transitions
 */

import { getCssVar } from '../utils/css.js';
import { getIcon } from '../config/icons.js';
import { TIMING } from '../config/constants.js';

/**
 * Set button to loading state
 * @param {HTMLButtonElement} button - Button element
 * @param {string} message - Loading message (shown in tooltip)
 */
export function setButtonLoading(button, message = 'Loading...') {
    if (!button) return;

    // Store original state
    button.disabled = true;
    button.dataset.originalHTML = button.innerHTML;
    button.dataset.originalTitle = button.title || '';

    // Add spinning animation to existing icon
    const svg = button.querySelector('svg');
    if (svg) {
        svg.classList.add('spinning');
    }

    // Update tooltip
    button.title = message;
}

/**
 * Set button to success state
 * @param {HTMLButtonElement} button - Button element
 * @param {string} message - Success message (shown in tooltip)
 * @param {number} duration - How long to show success (ms)
 * @returns {Promise<void>}
 */
export function setButtonSuccess(button, message, duration = TIMING.BUTTON_STATE_DURATION) {
    if (!button) return Promise.resolve();

    // Store original state if not already stored
    if (!button.dataset.originalHTML) {
        button.dataset.originalHTML = button.innerHTML;
        button.dataset.originalTitle = button.title || '';
    }
    button.dataset.originalBackground = button.style.background || '';
    button.dataset.originalColor = button.style.color || '';

    // Show success state - replace with checkmark icon
    button.innerHTML = getIcon('checkmark');
    button.style.background = getCssVar('--color-success-btn');
    button.style.color = 'white';
    button.title = message;

    return new Promise(resolve => {
        setTimeout(() => {
            resetButton(button);
            resolve();
        }, duration);
    });
}

/**
 * Set button to error state
 * @param {HTMLButtonElement} button - Button element
 * @param {string} message - Error message (shown in tooltip)
 * @param {number} duration - How long to show error (ms)
 * @returns {Promise<void>}
 */
export function setButtonError(button, message, duration = TIMING.BUTTON_STATE_DURATION) {
    if (!button) return Promise.resolve();

    // Store original state if not already stored
    if (!button.dataset.originalHTML) {
        button.dataset.originalHTML = button.innerHTML;
        button.dataset.originalTitle = button.title || '';
    }
    button.dataset.originalBackground = button.style.background || '';
    button.dataset.originalColor = button.style.color || '';

    // Show error state - replace with X icon
    button.innerHTML = getIcon('xMark');
    button.style.background = getCssVar('--color-error-btn');
    button.style.color = 'white';
    button.title = message;

    return new Promise(resolve => {
        setTimeout(() => {
            resetButton(button);
            resolve();
        }, duration);
    });
}

/**
 * Reset button to original state
 * @param {HTMLButtonElement} button - Button element
 */
export function resetButton(button) {
    if (!button) return;

    button.disabled = false;

    // Restore original HTML (icon)
    if (button.dataset.originalHTML) {
        button.innerHTML = button.dataset.originalHTML;
        delete button.dataset.originalHTML;
    }

    // Restore original title
    if (button.dataset.originalTitle !== undefined) {
        button.title = button.dataset.originalTitle;
        delete button.dataset.originalTitle;
    }

    // Restore original styles
    button.style.background = button.dataset.originalBackground || '';
    button.style.color = button.dataset.originalColor || '';

    // Clean up any spinning animation
    const svg = button.querySelector('svg');
    if (svg) {
        svg.classList.remove('spinning');
    }
}
