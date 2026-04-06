import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { askGeminiJSON } from '../utils/geminiApi';
import { logStudyActivity } from '../utils/studyActivity';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

function extractWeakTopic(question) {
    const aboutMatch = question.match(/about\s+([a-zA-Z0-9\s]+)/i);
    if (aboutMatch?.[1]) {
        return aboutMatch[1].trim().split(' ').slice(0, 4).join(' ');
    }

    return question
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 5)
        .join(' ');
}

function AdaptiveQuiz({ show, onHide, courseId, courseName }) {
    const [difficultyIndex, setDifficultyIndex] = useState(0);
    const [questionData, setQuestionData] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [weakTopics, setWeakTopics] = useState([]);
    const [error, setError] = useState('');
    const advanceTimeoutRef = useRef(null);

    const difficulty = DIFFICULTIES[difficultyIndex];

    const motivationalLine = useMemo(() => {
        if (score === 5) return 'Outstanding work. You are mastering this track!';
        if (score >= 3) return 'Great momentum. Keep practicing and level up!';
        return 'Strong effort. Review weak topics and come back stronger!';
    }, [score]);

    const loadQuestion = useCallback(async (level) => {
        setIsLoading(true);
        setError('');

        try {
            const result = await askGeminiJSON(
                'You are a quiz generator. Always return only valid JSON, no markdown, no extra text.',
                `Generate one multiple choice question about ${courseName} at ${level} difficulty. Return this exact JSON format: { question: string, options: { A: string, B: string, C: string, D: string }, correct: 'A' or 'B' or 'C' or 'D', explanation: string }`
            );
            setQuestionData(result);
        } catch {
            setError('AI is unavailable right now. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [courseName]);

    const resetQuiz = () => {
        if (advanceTimeoutRef.current) {
            clearTimeout(advanceTimeoutRef.current);
            advanceTimeoutRef.current = null;
        }
        setDifficultyIndex(0);
        setQuestionNumber(1);
        setScore(0);
        setFeedback(null);
        setQuestionData(null);
        setIsFinished(false);
        setWeakTopics([]);
        setError('');
    };

    useEffect(() => {
        if (!show) {
            return;
        }

        resetQuiz();
        loadQuestion('beginner');
    }, [show, courseName, loadQuestion]);

    const finishQuiz = (topicsToSave) => {
        const stored = localStorage.getItem(`weakTopics:${courseId}`);
        const existingTopics = stored ? stored.split(',').map((topic) => topic.trim()).filter(Boolean) : [];
        const merged = [...new Set([...existingTopics, ...topicsToSave])];
        localStorage.setItem(`weakTopics:${courseId}`, merged.join(','));
        logStudyActivity();
        setIsFinished(true);
    };

    const handleAnswer = (optionKey) => {
        if (!questionData || feedback) {
            return;
        }

        const isCorrect = optionKey === questionData.correct;
        const nextTopics = [...weakTopics];

        if (isCorrect) {
            setScore((prev) => prev + 1);
            setDifficultyIndex((prev) => Math.min(prev + 1, DIFFICULTIES.length - 1));
            setFeedback({ type: 'success', text: 'Correct! Leveling up difficulty.' });
        } else {
            const topic = extractWeakTopic(questionData.question || courseName);
            nextTopics.push(topic);
            setWeakTopics(nextTopics);
            setDifficultyIndex((prev) => Math.max(prev - 1, 0));
            setFeedback({
                type: 'danger',
                text: 'Not quite. Difficulty adjusted for better learning.',
                explanation: questionData.explanation
            });
        }

        if (advanceTimeoutRef.current) {
            clearTimeout(advanceTimeoutRef.current);
        }

        advanceTimeoutRef.current = setTimeout(() => {
            const isLastQuestion = questionNumber >= 5;
            if (isLastQuestion) {
                finishQuiz(nextTopics);
                return;
            }

            setQuestionNumber((prev) => prev + 1);
            setFeedback(null);
            const newDifficulty = isCorrect
                ? DIFFICULTIES[Math.min(difficultyIndex + 1, DIFFICULTIES.length - 1)]
                : DIFFICULTIES[Math.max(difficultyIndex - 1, 0)];
            loadQuestion(newDifficulty);
        }, 1500);
    };

    useEffect(() => {
        return () => {
            if (advanceTimeoutRef.current) {
                clearTimeout(advanceTimeoutRef.current);
            }
        };
    }, []);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    Adaptive Quiz - {courseName}
                    <Badge bg="dark" className="ms-2 text-capitalize">{difficulty}</Badge>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!isFinished && <p className="text-muted">Question {questionNumber} of 5</p>}

                {isLoading && (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mb-0 mt-2">Thinking...</p>
                    </div>
                )}

                {error && <Alert variant="warning">{error}</Alert>}

                {!isLoading && !error && questionData && !isFinished && (
                    <>
                        <h5>{questionData.question}</h5>
                        <div className="d-grid gap-2 mt-3">
                            {['A', 'B', 'C', 'D'].map((key) => (
                                <Button key={key} variant="outline-primary" onClick={() => handleAnswer(key)}>
                                    <strong>{key}.</strong> {questionData.options?.[key]}
                                </Button>
                            ))}
                        </div>
                    </>
                )}

                {feedback && (
                    <Alert variant={feedback.type} className="mt-3 mb-0">
                        <div>{feedback.text}</div>
                        {feedback.explanation && (
                            <div className="mt-2 p-2 rounded bg-light text-dark">
                                <strong>Explanation:</strong> {feedback.explanation}
                            </div>
                        )}
                    </Alert>
                )}

                {isFinished && (
                    <div className="py-2">
                        <h4>Quiz Completed</h4>
                        <p className="mb-1"><strong>Score:</strong> {score}/5</p>
                        <p className="mb-1"><strong>Topics where you struggled:</strong></p>
                        {weakTopics.length > 0 ? (
                            <ul>
                                {[...new Set(weakTopics)].map((topic) => (
                                    <li key={topic}>{topic}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No weak topics detected. Excellent consistency.</p>
                        )}
                        <Alert variant="info" className="mb-0">{motivationalLine}</Alert>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdaptiveQuiz;
