/**
 * Modal Component
 * Base modal dialog with backdrop, close handling, and body scroll lock
 */

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

let openModalCount = 0;
let previousBodyOverflow = '';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  'aria-label': string;
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
  'aria-label': label,
  className = '',
  contentClassName = '',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  testId,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointerDown = useRef(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog?.isConnected) {
      return;
    }
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (openModalCount++ === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    const initialFocus = dialog.querySelector<HTMLElement>(
      '[autofocus], h1, h2, input:not([disabled]), select:not([disabled])'
    );
    if (initialFocus) {
      if (/^H[12]$/.test(initialFocus.tagName)) {
        initialFocus.tabIndex = -1;
      }
      initialFocus.focus({ preventScroll: true });
    }
    return () => {
      dialog.close();
      if (--openModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }
      queueMicrotask(() => {
        // React may remove the node before native return runs. Inert top layers
        // reject focus behind them, while an opener in the remaining dialog is safe.
        if (opener?.isConnected && !opener.closest('[inert]') && opener.getClientRects().length) {
          opener.focus({ preventScroll: true });
        } else if (!document.querySelector('dialog:modal')) {
          document.querySelector<HTMLElement>('nav [aria-current="page"], nav .active')?.focus();
        }
      });
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <dialog
      ref={dialogRef}
      id={testId}
      className={`modal ${className}`}
      aria-label={label}
      aria-modal="true"
      onCancel={event => {
        event.preventDefault();
        if (closeOnEscape) {
          onClose();
        }
      }}
      onPointerDown={event => {
        backdropPointerDown.current = event.target === event.currentTarget;
      }}
      onClick={event => {
        if (closeOnBackdrop && backdropPointerDown.current && event.target === event.currentTarget) {
          onClose();
        }
        backdropPointerDown.current = false;
      }}
    >
      <div className={`modal-content ${contentClassName}`}>
        {showCloseButton && (
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        )}
        {children}
      </div>
    </dialog>
  );

  // Render to document body via portal
  return createPortal(modalContent, document.body);
}

export default Modal;
