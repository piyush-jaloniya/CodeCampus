import React from 'react';
import { Link } from 'react-router-dom';

/**
 * EmptyState — Replaces Bootstrap <Alert variant="secondary"> for empty data states.
 * Props:
 *   icon        {string}   — Emoji or icon character shown large at top
 *   title       {string}   — Bold heading
 *   description {string}   — Explanatory text
 *   action      {object}   — Optional CTA: { label, to, onClick }
 */
function EmptyState({ icon = '📭', title, description, action }) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">{icon}</div>
            {title && <h5 className="empty-state-title">{title}</h5>}
            {description && <p className="empty-state-desc">{description}</p>}
            {action && (
                action.to ? (
                    <Link to={action.to} className="btn btn-primary mt-2">
                        {action.label}
                    </Link>
                ) : (
                    <button
                        type="button"
                        className="btn btn-primary mt-2"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}

export default EmptyState;
