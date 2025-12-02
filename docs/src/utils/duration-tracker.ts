/**
 * Duration Tracker Utilities
 * Live duration updates for workflow runs
 */

import { formatDuration } from './formatting.js';
import { TIMING } from '../config/constants.js';

// Store interval IDs for cleanup
const intervals = new Map<string, ReturnType<typeof setInterval>>();

/**
 * Start live duration updates for workflow elements in a container
 */
export function startLiveDurationUpdates(
  containerSelector: string,
  id: string = 'default'
): ReturnType<typeof setInterval> | null {
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

    updateDurationElements(currentContainer as HTMLElement);
  }, TIMING.LIVE_DURATION_UPDATE);

  intervals.set(id, intervalId);
  return intervalId;
}

/**
 * Stop live duration updates
 */
export function stopLiveDurationUpdates(id: string = 'default'): void {
  const intervalId = intervals.get(id);
  if (intervalId) {
    clearInterval(intervalId);
    intervals.delete(id);
  }
}

/**
 * Stop all live duration trackers
 */
export function stopAllDurationUpdates(): void {
  intervals.forEach((intervalId) => {
    clearInterval(intervalId);
  });
  intervals.clear();
}

/**
 * Update all duration elements in a container
 */
function updateDurationElements(container: HTMLElement): void {
  const elements = container.querySelectorAll<HTMLElement>('.widget-run-duration');

  elements.forEach((el) => {
    const startedAt = el.dataset.started;
    const status = el.dataset.status;

    if (startedAt) {
      const start = new Date(startedAt);
      const now = new Date();
      const durationMs = now.getTime() - start.getTime();

      const timeStr = formatDuration(durationMs);

      let label: string;
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
