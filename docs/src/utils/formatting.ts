/**
 * Formatting Utilities
 * Pure utility functions for formatting dates, times, and text
 */

/**
 * Format timestamp as relative time
 */
export function formatRelativeTime(timestamp: string | Date | null | undefined): string {
  if (!timestamp) {return 'Unknown';}

  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {return 'Just now';}
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  // For older dates, show the actual date
  return date.toLocaleDateString();
}

/**
 * Format date with relative time for recent dates
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {return 'Today';}
  if (diffDays === 1) {return 'Yesterday';}
  if (diffDays < 7) {return `${diffDays} days ago`;}
  if (diffDays < 30) {return `${Math.floor(diffDays / 7)} weeks ago`;}

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return `${seconds}s ago`;
  }
}

/**
 * Format interval in milliseconds to human-readable string
 */
export function formatInterval(ms: number): string {
  if (ms === 0) {
    return 'Off';
  } else if (ms < 60000) {
    return `${ms / 1000} second${ms !== 1000 ? 's' : ''}`;
  } else {
    const minutes = ms / 60000;
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Escape HTML special characters to prevent XSS
 * Pure function - no DOM manipulation
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) {return '';}
  return str.charAt(0).toUpperCase() + str.slice(1);
}
