/**
 * Button State Management
 * Centralized button UI state transitions
 */

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
export function setButtonSuccess(button, message, duration = 3000) {
    if (!button) return Promise.resolve();

    // Store original state if not already stored
    if (!button.dataset.originalHTML) {
        button.dataset.originalHTML = button.innerHTML;
        button.dataset.originalTitle = button.title || '';
    }
    button.dataset.originalBackground = button.style.background || '';
    button.dataset.originalColor = button.style.color || '';

    // Show success state - replace with checkmark icon
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
        </svg>
    `;
    button.style.background = '#10b981';
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
export function setButtonError(button, message, duration = 3000) {
    if (!button) return Promise.resolve();

    // Store original state if not already stored
    if (!button.dataset.originalHTML) {
        button.dataset.originalHTML = button.innerHTML;
        button.dataset.originalTitle = button.title || '';
    }
    button.dataset.originalBackground = button.style.background || '';
    button.dataset.originalColor = button.style.color || '';

    // Show error state - replace with X icon
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
        </svg>
    `;
    button.style.background = '#ef4444';
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
