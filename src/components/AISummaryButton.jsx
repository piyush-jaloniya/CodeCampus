import React, { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { askGemini } from '../utils/geminiApi';

function AISummaryButton({ courseId, courseName, category }) {
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState('');

    const key = `aiSummary:${courseId}`;

    const handleToggleSummary = async () => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (summary) {
            setIsOpen(true);
            return;
        }

        const cached = localStorage.getItem(key);
        if (cached) {
            setSummary(cached);
            setIsOpen(true);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const aiText = await askGemini(
                'You are a concise course advisor. Write in plain, friendly language.',
                `Give a 4-sentence summary of the course '${courseName}' in the domain of ${category}. Cover: (1) what topics it includes, (2) who it's best suited for, (3) what the student will be able to build or do after completing it, (4) the difficulty level and estimated time to complete.`
            );
            setSummary(aiText);
            localStorage.setItem(key, aiText);
            setIsOpen(true);
        } catch {
            setError('AI is unavailable right now. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-100 mt-2">
            <button
                type="button"
                className="btn btn-sm w-100 ai-summary-trigger"
                onClick={handleToggleSummary}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Thinking...
                    </>
                ) : isOpen ? 'Hide Summary' : 'AI Summary ✦'}
            </button>

            {error && <small className="text-danger d-block mt-2">{error}</small>}

            <div className={`ai-summary-panel ${isOpen ? 'show' : ''}`}>
                {summary && <p className="mb-0">{summary}</p>}
            </div>
        </div>
    );
}

export default AISummaryButton;
