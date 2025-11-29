/**
 * Modal Management
 * Functions for opening, closing, and managing modal dialogs
 */

/**
 * Show a modal by ID
 * @param {string} modalId - ID of the modal element
 */
export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hide a modal by ID
 * @param {string} modalId - ID of the modal element
 */
export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

/**
 * Toggle a modal's visibility
 * @param {string} modalId - ID of the modal element
 */
export function toggleModal(modalId) {
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
export function closeAllModals() {
    const modals = document.querySelectorAll('[id$="-modal"]');
    modals.forEach(modal => {
        modal.classList.add('hidden');
    });
    document.body.style.overflow = '';
}

/**
 * Setup modal close handlers (click outside, ESC key)
 * @param {string} modalId - ID of the modal element
 * @param {Function} onClose - Optional callback when modal closes
 */
export function setupModalHandlers(modalId, onClose = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal(modalId);
            if (onClose) onClose();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hideModal(modalId);
            if (onClose) onClose();
        }
    });
}

/**
 * Create a simple confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Optional callback when cancelled
 */
export function showConfirmation(message, onConfirm, onCancel = null) {
    // Use native confirm for simplicity (can be replaced with custom modal)
    if (confirm(message)) {
        onConfirm();
    } else if (onCancel) {
        onCancel();
    }
}

/**
 * Update modal content
 * @param {string} modalId - ID of the modal
 * @param {string} contentSelector - Selector for content element within modal
 * @param {string|HTMLElement} content - New content
 */
export function updateModalContent(modalId, contentSelector, content) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const contentElement = modal.querySelector(contentSelector);
    if (!contentElement) return;

    if (typeof content === 'string') {
        contentElement.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        contentElement.innerHTML = '';
        contentElement.appendChild(content);
    }
}

/**
 * Set modal title
 * @param {string} modalId - ID of the modal
 * @param {string} title - New title
 */
export function setModalTitle(modalId, title) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const titleElement = modal.querySelector('h2, .modal-title, [data-modal-title]');
    if (titleElement) {
        titleElement.textContent = title;
    }
}
