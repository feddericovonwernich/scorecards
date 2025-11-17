/**
 * Button State Management
 * Centralized button UI state transitions
 */

/**
 * Set button to loading state
 * @param {HTMLButtonElement} button - Button element
 * @param {string} message - Loading message
 */
export function setButtonLoading(button, message = 'Loading...') {
    if (!button) return;

    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = `<span class="spinner"></span> ${message}`;
}

/**
 * Set button to success state
 * @param {HTMLButtonElement} button - Button element
 * @param {string} message - Success message
 * @param {number} duration - How long to show success (ms)
 * @returns {Promise<void>}
 */
export function setButtonSuccess(button, message, duration = 3000) {
    if (!button) return Promise.resolve();

    // Save original styles
    button.dataset.originalBackground = button.style.background || '';
    button.dataset.originalColor = button.style.color || '';

    // Show success state
    button.innerHTML = message;
    button.style.background = '#10b981';
    button.style.color = 'white';

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
 * @param {string} message - Error message
 * @param {number} duration - How long to show error (ms)
 * @returns {Promise<void>}
 */
export function setButtonError(button, message, duration = 3000) {
    if (!button) return Promise.resolve();

    // Save original styles
    button.dataset.originalBackground = button.style.background || '';
    button.dataset.originalColor = button.style.color || '';

    button.innerHTML = message;
    button.style.background = '#ef4444';
    button.style.color = 'white';

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
    button.textContent = button.dataset.originalText || button.textContent;
    button.style.background = button.dataset.originalBackground || '';
    button.style.color = button.dataset.originalColor || '';
}
