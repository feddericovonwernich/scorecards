/**
 * Formatting Utilities
 * Pure utility functions for formatting dates, times, and text
 */

/**
 * Format timestamp as relative time
 * @param {string|Date} timestamp - Date string or Date object
 * @returns {string} Relative time string (e.g., "5 minutes ago")
 */
export function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Unknown';

    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
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
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} durationMs - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "2h 15m ago")
 */
export function formatDuration(durationMs) {
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
 * @param {number} ms - Interval in milliseconds
 * @returns {string} Formatted interval
 */
export function formatInterval(ms) {
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
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
