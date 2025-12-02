/**
 * Modal Management
 * Functions for opening, closing, and managing modal dialogs
 */

/**
 * Show a modal by ID
 */
export function showModal(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide a modal by ID
 */
export function hideModal(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

/**
 * Toggle a modal's visibility
 */
export function toggleModal(modalId: string): void {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modal.classList.contains('hidden')) {
      showModal(modalId);
    } else {
      hideModal(modalId);
    }
  }
}

/**
 * Close all modals
 */
export function closeAllModals(): void {
  const modals = document.querySelectorAll('[id$="-modal"]');
  modals.forEach((modal) => {
    modal.classList.add('hidden');
  });
  document.body.style.overflow = '';
}

/**
 * Setup modal close handlers (click outside, ESC key)
 */
export function setupModalHandlers(
  modalId: string,
  onClose: (() => void) | null = null
): void {
  const modal = document.getElementById(modalId);
  if (!modal) {return;}

  // Close on click outside
  modal.addEventListener('click', (e: MouseEvent) => {
    if (e.target === modal) {
      hideModal(modalId);
      if (onClose) {onClose();}
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      hideModal(modalId);
      if (onClose) {onClose();}
    }
  });
}

/**
 * Create a simple confirmation dialog
 */
export function showConfirmation(
  message: string,
  onConfirm: () => void,
  onCancel: (() => void) | null = null
): void {
  // Use native confirm for simplicity (can be replaced with custom modal)
  if (confirm(message)) {
    onConfirm();
  } else if (onCancel) {
    onCancel();
  }
}

/**
 * Update modal content
 */
export function updateModalContent(
  modalId: string,
  contentSelector: string,
  content: string | HTMLElement
): void {
  const modal = document.getElementById(modalId);
  if (!modal) {return;}

  const contentElement = modal.querySelector(contentSelector);
  if (!contentElement) {return;}

  if (typeof content === 'string') {
    contentElement.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    contentElement.innerHTML = '';
    contentElement.appendChild(content);
  }
}

/**
 * Set modal title
 */
export function setModalTitle(modalId: string, title: string): void {
  const modal = document.getElementById(modalId);
  if (!modal) {return;}

  const titleElement = modal.querySelector(
    'h2, .modal-title, [data-modal-title]'
  );
  if (titleElement) {
    titleElement.textContent = title;
  }
}
