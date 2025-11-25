/**
 * Animation Utilities
 * Reusable animation helper functions
 */

/**
 * Start spinning animation on a button's SVG icon
 * @param {HTMLButtonElement} button - Button element containing SVG
 */
export function startButtonSpin(button) {
    if (!button) return;

    const svg = button.tagName === 'svg' ? button : button.querySelector('svg');
    if (svg) {
        svg.style.animation = 'spin 1s linear infinite';
    }
}

/**
 * Stop spinning animation on a button's SVG icon
 * @param {HTMLButtonElement} button - Button element containing SVG
 */
export function stopButtonSpin(button) {
    if (!button) return;

    const svg = button.tagName === 'svg' ? button : button.querySelector('svg');
    if (svg) {
        svg.style.animation = '';
    }
}

/**
 * Add spinning class to element (uses CSS animation)
 * @param {HTMLElement} element - Element to add spinning class to
 */
export function addSpinningClass(element) {
    if (!element) return;

    const svg = element.tagName === 'svg' ? element : element.querySelector('svg');
    if (svg) {
        svg.classList.add('spinning');
    }
}

/**
 * Remove spinning class from element
 * @param {HTMLElement} element - Element to remove spinning class from
 */
export function removeSpinningClass(element) {
    if (!element) return;

    const svg = element.tagName === 'svg' ? element : element.querySelector('svg');
    if (svg) {
        svg.classList.remove('spinning');
    }
}
