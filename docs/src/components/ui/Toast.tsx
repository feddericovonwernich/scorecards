/**
 * Toast Notification Component
 *
 * Displays temporary notification messages that auto-dismiss.
 * Supports multiple toast types: info, success, error, warning.
 * Uses CSS classes from toast.css for styling.
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/css.js';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: '\u2713', // ✓
  error: '\u2717',   // ✗
  warning: '\u26A0', // ⚠
  info: '\u2139',    // ℹ
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={cn(
        'toast',
        'toast-react',
        `toast-react--${toast.type}`,
        isVisible ? 'toast-react--visible' : 'toast-react--hidden'
      )}
    >
      <span className="toast-react__icon">
        {TOAST_ICONS[toast.type]}
      </span>
      <span className="toast-react__message">{toast.message}</span>
    </div>
  );
}

/**
 * Standalone Toast component for use in modals
 * Auto-dismisses after 5 seconds
 */
export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        'toast',
        'toast-react',
        `toast-react--${type}`,
        isVisible ? 'toast-react--visible' : 'toast-react--hidden'
      )}
    >
      <span className="toast-react__icon">
        {TOAST_ICONS[type]}
      </span>
      <span className="toast-react__message">{message}</span>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </>
  );
}

// Toast state management hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
  };
}

// Global toast instance for imperative API (bridge to vanilla JS)
let globalShowToast: ((message: string, type?: ToastType) => void) | null = null;

export function setGlobalToastHandler(
  handler: (message: string, type?: ToastType) => void
) {
  globalShowToast = handler;
}

export function showToastGlobal(message: string, type: ToastType = 'info') {
  if (globalShowToast) {
    globalShowToast(message, type);
  } else {
    // Fallback to console if React not mounted yet
    console.warn('[Toast]', type, message);
  }
}
