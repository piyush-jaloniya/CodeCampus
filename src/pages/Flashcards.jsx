import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Container, Spinner } from 'react-bootstrap';
import { askGemini } from '../utils/geminiApi';

function getAllFlashcards() {
    const cards = [];

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith('flashcards:')) {
            continue;
        }

        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(parsed)) {
                cards.push(...parsed.map((card) => ({ ...card, storageKey: key })));
            }
        } catch {
            // Ignore invalid flashcard payloads.
        }
    }

    return cards.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function Flashcards() {
    const [cards, setCards] = useState(() => getAllFlashcards());
    const [flipped, setFlipped] = useState({});
    const [answers, setAnswers] = useState({});
    const [loadingAnswerIds, setLoadingAnswerIds] = useState({});

    const totalCards = useMemo(() => cards.length, [cards.length]);

    const toggleFlip = (cardId) => {
        setFlipped((prev) => ({
            ...prev,
            [cardId]: !prev[cardId]
        }));
    };

    const handleDeleteCard = (event, card) => {
        event.stopPropagation();

        const remainingForCourse = cards
            .filter((item) => item.storageKey === card.storageKey)
            .filter((item) => item.id !== card.id)
            .map(({ storageKey, ...rest }) => rest);

        localStorage.setItem(card.storageKey, JSON.stringify(remainingForCourse));
        setCards((prev) => prev.filter((item) => !(item.storageKey === card.storageKey && item.id === card.id)));
    };

    const handleGenerateAnswer = async (event, card) => {
        event.stopPropagation();

        if (answers[card.id]) {
            return;
        }

        setLoadingAnswerIds((prev) => ({ ...prev, [card.id]: true }));

        try {
            const response = await askGemini(
                `You are a concise tutor. Explain the concept in simple language for a student in under 120 words. Course context: ${card.courseName || 'CodeCampus'}.`,
                `Explain this flashcard term clearly: "${card.front}"`
            );

            setAnswers((prev) => ({
                ...prev,
                [card.id]: response
            }));
        } catch {
            setAnswers((prev) => ({
                ...prev,
                [card.id]: 'Could not generate an answer right now. Please try again.'
            }));
        } finally {
            setLoadingAnswerIds((prev) => ({ ...prev, [card.id]: false }));
        }
    };

    return (
        <Container className="mt-4 pb-5">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h3 className="mb-0">Saved Flashcards</h3>
                <Badge bg="primary">{totalCards} total</Badge>
            </div>

            {cards.length === 0 && (
                <Alert variant="info" className="mb-0">
                    No flashcards saved yet. Highlight text in AI Notes and save it as a flashcard.
                </Alert>
            )}

            <div className="flashcards-grid">
                {cards.map((card) => (
                    <div
                        key={`${card.storageKey}-${card.id}`}
                        className={`flashcard-3d ${flipped[card.id] ? 'is-flipped' : ''}`}
                        onClick={() => toggleFlip(card.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleFlip(card.id);
                            }
                        }}
                    >
                        <div className="flashcard-3d-inner">
                            <div className="flashcard-face flashcard-front">
                                <button
                                    type="button"
                                    aria-label="Delete flashcard"
                                    className="flashcard-delete-btn"
                                    onClick={(event) => handleDeleteCard(event, card)}
                                >
                                    ×
                                </button>
                                <Badge bg="secondary" className="mb-2">{card.courseName || 'CodeCampus'}</Badge>
                                <p className="mb-0">{card.front}</p>
                            </div>

                            <div className="flashcard-face flashcard-back">
                                <h6 className="mb-2">AI Answer</h6>
                                {answers[card.id] ? (
                                    <p className="mb-0 small">{answers[card.id]}</p>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={(event) => handleGenerateAnswer(event, card)}
                                        disabled={Boolean(loadingAnswerIds[card.id])}
                                    >
                                        {loadingAnswerIds[card.id] ? (
                                            <span className="d-flex align-items-center gap-2">
                                                <Spinner animation="border" size="sm" />
                                                Generating...
                                            </span>
                                        ) : (
                                            'Generate answer'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Container>
    );
}

export default Flashcards;
