/**
 * Duration Tracker Utilities
 * Live duration updates for workflow runs
 */

import { formatDuration } from './formatting.js';
import { TIMING } from '../config/constants.js';

// Store interval IDs for cleanup
const intervals = new Map();

/**
 * Start live duration updates for workflow elements in a container
 * @param {string} containerSelector - CSS selector for container element
 * @param {string} [id='default'] - Unique identifier for this tracker (for cleanup)
 * @returns {number|null} Interval ID or null if container not found
 */
export function startLiveDurationUpdates(containerSelector, id = 'default') {
    // Clear any existing interval with the same ID
    stopLiveDurationUpdates(id);

    const container = document.querySelector(containerSelector);
    if (!container) {
        return null;
    }

    const intervalId = setInterval(() => {
        const currentContainer = document.querySelector(containerSelector);
        if (!currentContainer) {
            stopLiveDurationUpdates(id);
            return;
        }

        updateDurationElements(currentContainer);
    }, TIMING.LIVE_DURATION_UPDATE);

    intervals.set(id, intervalId);
    return intervalId;
}

/**
 * Stop live duration updates
 * @param {string} [id='default'] - Identifier of tracker to stop
 */
export function stopLiveDurationUpdates(id = 'default') {
    const intervalId = intervals.get(id);
    if (intervalId) {
        clearInterval(intervalId);
        intervals.delete(id);
    }
}

/**
 * Stop all live duration trackers
 */
export function stopAllDurationUpdates() {
    intervals.forEach((intervalId) => {
        clearInterval(intervalId);
    });
    intervals.clear();
}

/**
 * Update all duration elements in a container
 * @param {HTMLElement} container - Container element
 */
function updateDurationElements(container) {
    const elements = container.querySelectorAll('.widget-run-duration');

    elements.forEach(el => {
        const startedAt = el.dataset.started;
        const status = el.dataset.status;

        if (startedAt) {
            const start = new Date(startedAt);
            const now = new Date();
            const durationMs = now - start;

            const timeStr = formatDuration(durationMs);

            let label;
            if (status === 'in_progress') {
                label = 'Running for';
            } else if (status === 'queued') {
                label = 'Queued';
            } else {
                label = 'Completed';
            }

            el.textContent = `${label} ${timeStr}`;
        }
    });
}
