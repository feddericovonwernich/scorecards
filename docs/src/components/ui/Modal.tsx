/**
 * Modal Component
 * Base modal dialog with backdrop, close handling, and body scroll lock
 */

import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Test ID for the modal wrapper element */
  testId?: string;
}

/**
 * Modal component with backdrop and close handling
 */
export function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  contentClassName = '',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  testId,
}: ModalProps) {
  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle body scroll lock and keyboard events
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      id={testId}
      className={`modal ${className}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={`modal-content ${contentClassName}`}>
        {showCloseButton && (
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        )}
        {children}
      </div>
    </div>
  );

  // Render to document body via portal
  return createPortal(modalContent, document.body);
}

export default Modal;
