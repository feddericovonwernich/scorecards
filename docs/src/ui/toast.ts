/**
 * Toast Notification System
 * Function for displaying temporary notification messages
 */

import { escapeHtml } from '../utils/formatting.js';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

/**
 * Show a toast notification
 */
export function showToast(message: string, type: ToastType = 'info'): void {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Add icon based on type
  let icon = '';
  switch (type) {
  case 'success':
    icon = '✓';
    break;
  case 'error':
    icon = '✗';
    break;
  case 'warning':
    icon = '⚠';
    break;
  case 'info':
  default:
    icon = 'ℹ';
    break;
  }

  toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

  // Add to container
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      container?.removeChild(toast);
    }, 300);
  }, 5000);
}
