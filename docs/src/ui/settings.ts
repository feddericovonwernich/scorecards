/**
 * Settings Modal and PAT Management
 * Handles GitHub Personal Access Token configuration and display
 */

import { showToast } from './toast.js';
import { handlePATSaved, handlePATCleared } from './actions-widget.js';
import { setToken, clearToken, getToken } from '../services/auth.js';

/**
 * Open settings modal
 */
export function openSettings(): void {
  const modal = document.getElementById('settings-modal');
  modal?.classList.remove('hidden');

  // Update UI to reflect current PAT state
  updateModeIndicator();

  // Auto-check rate limit when opening settings
  checkRateLimit();
}

/**
 * Close settings modal
 */
export function closeSettings(): void {
  const modal = document.getElementById('settings-modal');
  modal?.classList.add('hidden');
}

/**
 * Test if a PAT is valid
 */
export async function testPAT(pat: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error testing PAT:', error);
    return false;
  }
}

/**
 * Save PAT to in-memory storage
 */
export async function savePAT(): Promise<void> {
  const input = document.getElementById(
    'github-pat-input'
  ) as HTMLInputElement | null;
  const pat = input?.value.trim();

  if (!pat) {
    showToast('Please enter a valid PAT', 'error');
    return;
  }

  // Test the PAT first
  showToast('Validating token...', 'info');
  const isValid = await testPAT(pat);

  if (isValid) {
    setToken(pat);
    updateWidgetState();
    updateModeIndicator();

    // Notify actions widget
    handlePATSaved();

    showToast('PAT saved successfully! Using GitHub API mode.', 'success');
    checkRateLimit(); // Update rate limit display
  } else {
    showToast('Invalid PAT. Please check and try again.', 'error');
  }
}

/**
 * Clear PAT from in-memory storage
 */
export function clearPAT(): void {
  clearToken();
  const input = document.getElementById(
    'github-pat-input'
  ) as HTMLInputElement | null;
  if (input) {input.value = '';}
  updateWidgetState();
  updateModeIndicator();

  // Notify actions widget
  handlePATCleared();

  showToast('PAT cleared. Using public CDN mode.', 'info');
  checkRateLimit(); // Update rate limit display
}

/**
 * Update the widget visual state based on PAT presence
 */
export function updateWidgetState(): void {
  const settingsBtn = document.getElementById('settings-btn');
  const unlockedIcon = document.querySelector<HTMLElement>('.unlocked-icon');
  const lockedIcon = document.querySelector<HTMLElement>('.locked-icon');

  if (getToken()) {
    // PAT loaded - show locked icon
    settingsBtn?.classList.add('has-token');
    if (unlockedIcon) {unlockedIcon.style.display = 'none';}
    if (lockedIcon) {lockedIcon.style.display = 'block';}
    settingsBtn?.setAttribute('title', 'Settings (PAT loaded)');
    settingsBtn?.setAttribute('aria-label', 'Settings (PAT loaded)');
  } else {
    // No PAT - show unlocked icon
    settingsBtn?.classList.remove('has-token');
    if (unlockedIcon) {unlockedIcon.style.display = 'block';}
    if (lockedIcon) {lockedIcon.style.display = 'none';}
    settingsBtn?.setAttribute('title', 'Settings');
    settingsBtn?.setAttribute('aria-label', 'Settings');
  }
}

/**
 * Update mode indicator in settings modal
 */
export function updateModeIndicator(): void {
  const indicator = document.getElementById('mode-indicator');
  const currentMode = document.querySelector('.current-mode');

  if (getToken()) {
    if (indicator) {indicator.textContent = 'GitHub API (fast, authenticated)';}
    currentMode?.classList.add('api-mode');
  } else {
    if (indicator) {indicator.textContent = 'Public CDN (slower, no rate limits)';}
    currentMode?.classList.remove('api-mode');
  }
}

interface RateLimitResponse {
  rate: {
    remaining: number;
    limit: number;
    reset: number;
  };
}

/**
 * Check and display GitHub API rate limit status
 */
export async function checkRateLimit(): Promise<void> {
  try {
    const token = getToken();
    const headers: Record<string, string> = token
      ? { Authorization: `token ${token}` }
      : {};

    const response = await fetch('https://api.github.com/rate_limit', {
      headers,
    });
    const data: RateLimitResponse = await response.json();

    const setElementText = (id: string, value: string | number): void => {
      const el = document.getElementById(id);
      if (el) {el.textContent = String(value);}
    };

    setElementText('rate-limit-remaining', data.rate.remaining);
    setElementText('rate-limit-limit', data.rate.limit);
    setElementText(
      'rate-limit-reset',
      new Date(data.rate.reset * 1000).toLocaleTimeString()
    );

    if (data.rate.remaining < 10) {
      showToast('Warning: Low rate limit remaining!', 'warning');
    }
  } catch (error) {
    console.error('Error checking rate limit:', error);
    const setError = (id: string, value: string): void => {
      const el = document.getElementById(id);
      if (el) {el.textContent = value;}
    };
    setError('rate-limit-remaining', 'Error');
    setError('rate-limit-limit', '-');
    setError('rate-limit-reset', '-');
  }
}
