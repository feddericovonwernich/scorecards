/**
 * Animation Utilities
 * Reusable animation helper functions
 */

/**
 * Start spinning animation on a button's SVG icon
 */
export function startButtonSpin(button: HTMLElement | null): void {
  if (!button) {return;}

  const svg =
    button.tagName === 'svg' ? button : button.querySelector('svg');
  if (svg) {
    (svg as HTMLElement).style.animation = 'spin 1s linear infinite';
  }
}

/**
 * Stop spinning animation on a button's SVG icon
 */
export function stopButtonSpin(button: HTMLElement | null): void {
  if (!button) {return;}

  const svg =
    button.tagName === 'svg' ? button : button.querySelector('svg');
  if (svg) {
    (svg as HTMLElement).style.animation = '';
  }
}

/**
 * Add spinning class to element (uses CSS animation)
 */
export function addSpinningClass(element: HTMLElement | null): void {
  if (!element) {return;}

  const svg =
    element.tagName === 'svg' ? element : element.querySelector('svg');
  if (svg) {
    svg.classList.add('spinning');
  }
}

/**
 * Remove spinning class from element
 */
export function removeSpinningClass(element: HTMLElement | null): void {
  if (!element) {return;}

  const svg =
    element.tagName === 'svg' ? element : element.querySelector('svg');
  if (svg) {
    svg.classList.remove('spinning');
  }
}
