/**
 * Floating Controls Component
 * Theme toggle, settings, and actions widget buttons
 * Uses CSS classes from floating-controls.css for styling
 */

import { useCallback } from 'react';
import { cn } from '../../utils/css.js';
import { useAppStore, selectPAT, selectDisplayMode } from '../../stores/appStore.js';
import { useTheme } from '../../hooks/useTheme.js';

export interface FloatingControlsProps {
  onSettingsClick?: () => void;
  onActionsWidgetClick?: () => void;
  actionsBadgeCount?: number;
}

/**
 * Sun icon for light mode
 */
function SunIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.06-1.06a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

/**
 * Moon icon for dark mode
 */
function MoonIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z" />
    </svg>
  );
}

/**
 * Settings/Lock icon
 */
function SettingsIcon({ hasToken, className = '' }: { hasToken: boolean; className?: string }) {
  if (hasToken) {
    return (
      <svg className={className} width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z" />
      </svg>
    );
  }
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 4a2.5 2.5 0 0 1 4.607-1.346.75.75 0 1 0 1.264-.808A4 4 0 0 0 4 4v1.5H3A1.5 1.5 0 0 0 1.5 7v7A1.5 1.5 0 0 0 3 15.5h10a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 13 5.5h-7V4Z" />
    </svg>
  );
}

/**
 * Clock/Actions icon
 */
function ActionsIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

/**
 * Grid icon for grid view mode
 */
function GridIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3Zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3Zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3Zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3Z"/>
    </svg>
  );
}

/**
 * List icon for list view mode
 */
function ListIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm3.75-1.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5ZM3 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
    </svg>
  );
}

/**
 * Floating Controls Component
 */
export function FloatingControls({
  onSettingsClick,
  onActionsWidgetClick,
  actionsBadgeCount = 0,
}: FloatingControlsProps) {
  // Use theme hook
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Get token state from Zustand store (reactive updates)
  const pat = useAppStore(selectPAT);
  const hasToken = !!pat;

  // Get display mode from store
  const displayMode = useAppStore(selectDisplayMode);
  const setDisplayMode = useAppStore((state) => state.setDisplayMode);

  // Toggle display mode (grid/list)
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(displayMode === 'grid' ? 'list' : 'grid');
  }, [displayMode, setDisplayMode]);

  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Fallback to global function
      window.openSettings?.();
    }
  }, [onSettingsClick]);

  // Handle actions widget click
  const handleActionsClick = useCallback(() => {
    if (onActionsWidgetClick) {
      onActionsWidgetClick();
    } else {
      // Fallback to global function
      window.toggleActionsWidget?.();
    }
  }, [onActionsWidgetClick]);

  return (
    <div className="floating-controls">
      {/* Display Mode Toggle (Grid/List) */}
      <button
        className="floating-btn floating-btn--display"
        title={`Switch to ${displayMode === 'grid' ? 'list' : 'grid'} view`}
        aria-label={`Switch to ${displayMode === 'grid' ? 'list' : 'grid'} view`}
        onClick={toggleDisplayMode}
      >
        {displayMode === 'grid' ? <ListIcon /> : <GridIcon />}
      </button>

      {/* Theme Toggle */}
      <button
        className="floating-btn floating-btn--theme"
        title="Toggle night mode"
        aria-label="Toggle night mode"
        onClick={toggleTheme}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </button>

      {/* Settings */}
      <button
        className={cn('floating-btn floating-btn--settings', hasToken && 'has-token')}
        title={hasToken ? 'Settings (PAT active)' : 'Settings'}
        aria-label={hasToken ? 'Settings (PAT active)' : 'Settings'}
        onClick={handleSettingsClick}
      >
        <SettingsIcon hasToken={hasToken} />
      </button>

      {/* GitHub Actions Widget Toggle */}
      <button
        className="floating-btn floating-btn--widget"
        title="Show GitHub Actions"
        aria-label="Show GitHub Actions"
        onClick={handleActionsClick}
      >
        <ActionsIcon />
        {actionsBadgeCount > 0 && (
          <span className="widget-badge" data-count={actionsBadgeCount}>
            {actionsBadgeCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default FloatingControls;
