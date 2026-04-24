import React, { useEffect, useRef } from 'react';

/**
 * ConfirmModal — A branded, accessible replacement for window.confirm().
 * Props:
 *   show        {boolean}  — Whether to display the modal
 *   icon        {string}   — Emoji/icon shown above the title
 *   title       {string}   — Modal heading
 *   description {string}   — Descriptive text below the title
 *   confirmLabel {string}  — Confirm button label (default: "Confirm")
 *   cancelLabel  {string}  — Cancel button label (default: "Cancel")
 *   confirmVariant {string} — 'danger' | 'primary' (default: 'danger')
 *   onConfirm   {function} — Called when user confirms
 *   onCancel    {function} — Called when user cancels (or presses Escape)
 */
function ConfirmModal({
    show,
    icon = '⚠️',
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'danger',
    onConfirm,
    onCancel
}) {
    const cancelRef = useRef(null);

    // Focus cancel button on open, and close on Escape
    useEffect(() => {
        if (!show) return;
        cancelRef.current?.focus();
        const handleKey = (e) => {
            if (e.key === 'Escape') onCancel?.();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [show, onCancel]);

    if (!show) return null;

    const confirmBtnClass = confirmVariant === 'danger'
        ? 'confirm-btn confirm-btn-danger'
        : 'confirm-btn confirm-btn-primary';

    return (
        <div
            className="confirm-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) onCancel?.();
            }}
        >
            <div className="confirm-modal-card">
                <div className="confirm-modal-icon" aria-hidden="true">{icon}</div>
                <h3 className="confirm-modal-title" id="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-desc" id="confirm-modal-desc">{description}</p>
                <div className="d-flex gap-2 justify-content-end">
                    <button
                        ref={cancelRef}
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`btn ${confirmBtnClass}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
