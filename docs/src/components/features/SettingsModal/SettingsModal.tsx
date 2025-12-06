/**
 * SettingsModal Component
 * Modal for managing GitHub PAT and viewing rate limit status
 * Premium design with staggered animations and visual hierarchy
 */

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../ui/Modal.js';
import { Toast } from '../../ui/Toast.js';
import {
  useAppStore,
  selectPAT,
  selectRateLimit,
  selectAuthUser,
} from '../../../stores/appStore.js';
import { setToken, clearToken, validateToken } from '../../../services/auth.js';
import type { RateLimitInfo } from '../../../types/index.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface GitHubUserResponse {
  login: string;
  avatar_url: string;
  name?: string;
}

interface RateLimitResponse {
  rate: {
    remaining: number;
    limit: number;
    reset: number;
    used: number;
  };
}

// Settings gear icon
function SettingsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// Shield check icon for authenticated mode
function ShieldCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Globe icon for public CDN mode
function GlobeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// GitHub key icon for input
function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

// Question mark icon for help
function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// Chevron icon for accordion
function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
    </svg>
  );
}

// Loading spinner
function Spinner() {
  return (
    <svg className="settings-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// Zap icon for fast mode
function ZapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

// Eye icons for show/hide token
function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Store state
  const pat = useAppStore(selectPAT);
  const rateLimit = useAppStore(selectRateLimit);
  const authUser = useAppStore(selectAuthUser);
  const setAuth = useAppStore((state) => state.setAuth);
  const setRateLimitStore = useAppStore((state) => state.setRateLimit);
  const setAuthUser = useAppStore((state) => state.setAuthUser);

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingRate, setIsCheckingRate] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const showToast = (message: string, type: ToastMessage['type']) => {
    setToast({ message, type });
  };

  // Define fetchRateLimit before useEffects that depend on it
  const fetchRateLimit = useCallback(async () => {
    try {
      const token = pat;
      const headers: Record<string, string> = token
        ? { Authorization: `token ${token}` }
        : {};

      const response = await fetch('https://api.github.com/rate_limit', {
        headers,
      });
      const data: RateLimitResponse = await response.json();

      const rateLimitInfo: RateLimitInfo = {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        reset: new Date(data.rate.reset * 1000),
        used: data.rate.used,
      };

      setRateLimitStore(rateLimitInfo);
    } catch (error) {
      console.error('Error checking rate limit:', error);
      setRateLimitStore({
        remaining: null,
        limit: null,
        reset: null,
        error: 'Failed to fetch rate limit',
      });
    }
  }, [pat, setRateLimitStore]);

  // Initialize input with current PAT (masked) when modal opens
  useEffect(() => {
    if (isOpen && pat) {
      setInputValue(pat);
    } else if (isOpen && !pat) {
      setInputValue('');
    }
  }, [isOpen, pat]);

  // Fetch rate limit when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRateLimit();
    }
  }, [isOpen, fetchRateLimit]);

  const fetchUserInfo = async (token: string): Promise<GitHubUserResponse | null> => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSavePAT = useCallback(async () => {
    const trimmedPat = inputValue.trim();

    if (!trimmedPat) {
      showToast('Please enter a valid PAT', 'error');
      return;
    }

    setIsValidating(true);
    showToast('Validating token...', 'info');

    try {
      const isValid = await validateToken(trimmedPat);

      if (isValid) {
        setToken(trimmedPat);
        setAuth(trimmedPat, true);

        // Fetch user info
        const userInfo = await fetchUserInfo(trimmedPat);
        if (userInfo) {
          setAuthUser({ login: userInfo.login, avatar_url: userInfo.avatar_url });
        }

        showToast('PAT saved successfully! Using GitHub API mode.', 'success');

        // Update rate limit
        await fetchRateLimit();
      } else {
        showToast('Invalid PAT. Please check and try again.', 'error');
      }
    } catch (error) {
      console.error('Error validating PAT:', error);
      showToast('Error validating PAT. Please try again.', 'error');
    } finally {
      setIsValidating(false);
    }
  }, [inputValue, setAuth, setAuthUser, fetchRateLimit]);

  const handleClearPAT = useCallback(() => {
    clearToken();
    setAuth(null, false);
    setAuthUser(null);
    setInputValue('');
    showToast('PAT cleared. Using public CDN mode.', 'info');
    fetchRateLimit();
  }, [setAuth, setAuthUser, fetchRateLimit]);

  const handleCheckRateLimit = useCallback(async () => {
    setIsCheckingRate(true);
    await fetchRateLimit();
    setIsCheckingRate(false);
    showToast('Rate limit updated', 'info');
  }, [fetchRateLimit]);

  const formatResetTime = (reset: Date | number | null): string => {
    if (!reset) {return '-';}
    const date = reset instanceof Date ? reset : new Date(reset);
    return date.toLocaleTimeString();
  };

  const getRateLimitPercentage = (): number => {
    if (!rateLimit?.remaining || !rateLimit?.limit) {return 0;}
    return (rateLimit.remaining / rateLimit.limit) * 100;
  };

  const isLowRateLimit = rateLimit !== null && rateLimit.remaining !== null && rateLimit.remaining < 100;
  const isCriticalRateLimit = rateLimit !== null && rateLimit.remaining !== null && rateLimit.remaining < 10;

  const getRateLimitStatus = () => {
    if (isCriticalRateLimit) {
      return 'critical';
    }
    if (isLowRateLimit) {
      return 'low';
    }
    return 'normal';
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        contentClassName="settings-modal-content"
        testId="settings-modal"
      >
        <div className="settings-content">
          {/* ZONE 1: Header */}
          <div className="settings-header settings-animate settings-animate-1">
            <div className="settings-header-icon">
              <SettingsIcon />
            </div>
            <div className="settings-header-text">
              <h2>Settings</h2>
              <p>Configure GitHub authentication</p>
            </div>
          </div>

          {/* ZONE 2: Status Hero Card */}
          <div className={`settings-hero settings-animate settings-animate-2 ${pat ? 'settings-hero--authenticated' : ''}`}>
            <div className="settings-hero-content">
              {/* Mode indicator row */}
              <div className="settings-hero-main">
                <div className="settings-mode-icon">
                  {pat ? <ShieldCheckIcon /> : <GlobeIcon />}
                </div>
                <div className="settings-mode-info">
                  <div className="settings-mode-title">
                    <h3>{pat ? 'GitHub API Mode' : 'Public CDN Mode'}</h3>
                    {pat && (
                      <span className="settings-mode-badge">
                        <ZapIcon />
                      </span>
                    )}
                  </div>
                  <p className="settings-mode-description">
                    {pat
                      ? 'Fast, authenticated access with 5,000 requests/hour'
                      : 'Slower fallback mode with no rate limits'
                    }
                  </p>
                </div>
              </div>

              {/* User info (integrated into hero when authenticated) */}
              {authUser && (
                <div className="settings-user-info">
                  <div className="settings-user-avatar">
                    <img
                      src={authUser.avatar_url}
                      alt={authUser.login}
                    />
                  </div>
                  <div className="settings-user-details">
                    <div className="settings-user-label">Authenticated as</div>
                    <div className="settings-user-name">@{authUser.login}</div>
                  </div>
                </div>
              )}

              {/* Prompt for unauthenticated users */}
              {!pat && (
                <div className="settings-hero-prompt">
                  <p>
                    Add a Personal Access Token for faster GitHub API access and higher rate limits.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ZONE 3: Configuration Section */}
          <div className="settings-config">
            {/* Collapsible Help Accordion */}
            <div className="settings-animate settings-animate-3">
              <button
                onClick={() => setInfoExpanded(!infoExpanded)}
                className={`settings-accordion ${infoExpanded ? 'settings-accordion--expanded' : ''}`}
              >
                <div className="settings-accordion-icon">
                  <HelpIcon />
                </div>
                <span className="settings-accordion-text">
                  How to create a Personal Access Token
                </span>
                <div className="settings-accordion-chevron">
                  <ChevronIcon />
                </div>
              </button>

              {infoExpanded && (
                <div className="settings-accordion-content">
                  <div className="settings-accordion-item">
                    <strong>Steps:</strong>{' '}
                    Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic).
                    Create a token with <code>workflow</code> scope.
                  </div>
                  <div className="settings-accordion-item">
                    <strong>Benefits:</strong>{' '}
                    Using a PAT provides faster API access with higher rate limits (5000/hr vs 60/hr for unauthenticated).
                  </div>
                  <div className="settings-accordion-item">
                    <strong>Security:</strong>{' '}
                    Your token is stored in memory only and never persisted to localStorage or sent to external servers.
                  </div>
                </div>
              )}
            </div>

            {/* PAT Input */}
            <div className="settings-input-section settings-animate settings-animate-4">
              <label htmlFor="github-pat" className="settings-input-label">
                GitHub Personal Access Token
              </label>
              <div className="settings-input-wrapper">
                <div className="settings-input-icon">
                  <KeyIcon />
                </div>
                <input
                  id="github-pat"
                  type={showToken ? 'text' : 'password'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="settings-input"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="settings-input-toggle"
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
              <p className="settings-input-hint">
                Token is stored in memory only and not persisted to localStorage
              </p>
            </div>

            {/* Action Buttons */}
            <div className="settings-actions settings-animate settings-animate-5">
              {/* Secondary: Check Rate */}
              <button
                onClick={handleCheckRateLimit}
                disabled={isCheckingRate}
                className="settings-btn settings-btn--secondary"
              >
                {isCheckingRate ? <Spinner /> : 'Check Rate'}
              </button>

              {/* Primary: Save Token */}
              <button
                onClick={handleSavePAT}
                disabled={isValidating || !inputValue.trim()}
                className="settings-btn settings-btn--primary"
              >
                {isValidating ? <Spinner /> : 'Save Token'}
              </button>

              {/* Ghost: Clear Token */}
              <button
                onClick={handleClearPAT}
                disabled={!pat}
                className="settings-btn settings-btn--ghost"
              >
                Clear Token
              </button>
            </div>
          </div>

          {/* ZONE 4: Rate Limit Section */}
          <div className="settings-rate-limit settings-animate settings-animate-6">
            <div className="settings-rate-limit-inner">
              {/* Header row with stats */}
              <div className="settings-rate-limit-header">
                <h3 className="settings-rate-limit-title">API Rate Limit</h3>
                {rateLimit?.limit && (
                  <span className="settings-rate-limit-value">
                    <span className={`settings-rate-limit-current settings-rate-limit-current--${getRateLimitStatus()}`}>
                      {rateLimit.remaining}
                    </span>
                    <span className="settings-rate-limit-divider">/</span>
                    <span>{rateLimit.limit}</span>
                    <span className="settings-rate-limit-unit">requests</span>
                  </span>
                )}
              </div>

              {/* Progress Bar with Glow */}
              {rateLimit?.limit && (
                <div className="settings-progress">
                  {/* Glow effect layer */}
                  <div
                    className={`settings-progress-glow settings-progress-glow--${getRateLimitStatus()}`}
                    style={{ width: `${getRateLimitPercentage()}%` }}
                  />
                  {/* Main progress bar */}
                  <div
                    className={`settings-progress-fill settings-progress-fill--${getRateLimitStatus()}`}
                    style={{ width: `${getRateLimitPercentage()}%` }}
                  />
                </div>
              )}

              {/* Footer row */}
              <div className="settings-rate-limit-footer">
                <span className="settings-rate-limit-reset">
                  Resets at {formatResetTime(rateLimit?.reset ?? null)}
                </span>
                {isLowRateLimit && (
                  <span className={`settings-rate-limit-badge settings-rate-limit-badge--${isCriticalRateLimit ? 'critical' : 'low'}`}>
                    {isCriticalRateLimit ? 'Critical!' : 'Running low'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default SettingsModal;
