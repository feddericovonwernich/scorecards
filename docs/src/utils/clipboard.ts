/**
 * Clipboard Utilities
 * Functions for copying text to clipboard with fallback support
 */

import { getCssVar } from './css.js';
import { TIMING } from '../config/constants.js';

/**
 * Fallback method for copying to clipboard using legacy execCommand
 */
function fallbackCopyToClipboard(text: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (_err) {
    document.body.removeChild(textArea);
    return false;
  }
}

/**
 * Copy badge code to clipboard with visual feedback
 */
export async function copyBadgeCode(
  elementId: string,
  event?: Event | null
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {return;}

  const text = element.textContent || '';
  const button = (event?.currentTarget || event?.target) as HTMLElement | null;

  try {
    // Try modern Clipboard API first (requires HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-HTTPS or older browsers
      const success = fallbackCopyToClipboard(text);
      if (!success) {
        throw new Error('Fallback copy failed');
      }
    }

    // Success feedback
    if (button) {
      const originalText = button.textContent || '';
      button.textContent = 'Copied!';
      (button as HTMLElement).style.background = getCssVar('--color-copy-success');

      setTimeout(() => {
        button.textContent = originalText;
        (button as HTMLElement).style.background = getCssVar('--color-copy-default');
      }, TIMING.BUTTON_FEEDBACK);
    }
  } catch (err) {
    console.error('Failed to copy:', err);

    // Provide specific error messages
    let message = 'Failed to copy to clipboard. ';
    if (!window.isSecureContext) {
      message += 'This page must be served over HTTPS.';
    } else if (err instanceof Error && err.name === 'NotAllowedError') {
      message += 'Please allow clipboard access in your browser.';
    } else {
      message += 'Please select and copy the text manually.';
    }

    alert(message);
  }
}
