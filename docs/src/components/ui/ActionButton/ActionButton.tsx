/**
 * ActionButton Component
 * Button with built-in loading, success, and error states
 * Used for async operations like workflow triggers
 */

import { type ReactNode, type MouseEvent } from 'react';
import { type ButtonState } from '../../../hooks/useButtonState.js';
import styles from './ActionButton.module.css';

interface ActionButtonProps {
  children: ReactNode;
  state?: ButtonState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  variant?: 'default' | 'bulk' | 'neutral' | 'accent';
}

export function ActionButton({
  children,
  state = 'idle',
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Failed',
  onClick,
  disabled,
  className = '',
  title,
  variant = 'default',
}: ActionButtonProps) {
  const isDisabled = disabled || state === 'loading';

  const getContent = () => {
    switch (state) {
    case 'loading':
      return (
        <>
          <SpinningIcon />
          {loadingText}
        </>
      );
    case 'success':
      return (
        <>
          <CheckmarkIcon />
          {successText}
        </>
      );
    case 'error':
      return (
        <>
          <ErrorIcon />
          {errorText}
        </>
      );
    default:
      return children;
    }
  };

  const getTitle = () => {
    switch (state) {
    case 'loading':
      return loadingText;
    case 'success':
      return '✓ ' + successText;
    case 'error':
      return '✗ ' + errorText;
    default:
      return title;
    }
  };

  const variantClass = variant !== 'default' ? `trigger-btn-${variant}` : '';

  return (
    <button
      className={`trigger-btn ${variantClass} ${styles.actionButton} ${styles[state]} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      title={getTitle()}
      data-state={state}
    >
      {getContent()}
    </button>
  );
}

function SpinningIcon() {
  return (
    <svg
      className={styles.spinning}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
  );
}

function CheckmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}
