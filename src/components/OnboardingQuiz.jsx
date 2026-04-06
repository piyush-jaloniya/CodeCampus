import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { askGeminiJSON } from '../utils/geminiApi';
import { getCourses } from '../services/courseService';

const QUESTIONS = [
    {
        key: 'codingLevel',
        label: 'What is your current coding level?',
        options: ['Beginner', 'Intermediate', 'Advanced']
    },
    {
        key: 'primaryGoal',
        label: 'What is your primary goal?',
        options: ['Get a job', 'Build projects', 'Learn for fun', 'Competitive coding']
    },
    {
        key: 'hoursPerWeek',
        label: 'How many hours per week can you dedicate?',
        options: ['Less than 2hrs', '2-5hrs', '5-10hrs', '10+ hrs']
    },
    {
        key: 'domain',
        label: 'Which domain interests you most?',
        options: ['Web Dev', 'AI & ML', 'Data Science', 'Mobile Dev', 'DSA']
    },
    {
        key: 'language',
        label: 'Which language are you most comfortable with?',
        options: ['None yet', 'Python', 'JavaScript', 'C++', 'Java']
    }
];

function normalizeRecommendations(result, fallbackCourses) {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.recommendations)) {
        return result.recommendations;
    }

    return fallbackCourses.slice(0, 5).map((course, index) => ({
        id: course.id,
        title: course.title,
        reason: `Suggested as step ${index + 1} based on your onboarding profile.`
    }));
}

function OnboardingQuiz({ courseList, onComplete }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const fallbackTimeoutRef = useRef(null);

    const normalizedCourseList = useMemo(() => {
        if (Array.isArray(courseList) && courseList.length > 0) {
            return courseList;
        }

        return getCourses().map((course) => ({
            id: course.id,
            title: course.title,
            category: course.category,
            difficulty: course.difficulty
        }));
    }, [courseList]);

    const currentQuestion = QUESTIONS[step];
    const selected = answers[currentQuestion.key];
    const progress = ((step + 1) / QUESTIONS.length) * 100;

    const answersSummary = useMemo(() => {
        return QUESTIONS.map((q) => `${q.label} ${answers[q.key] || ''}`).join(' | ');
    }, [answers]);

    const handleSkip = () => {
        localStorage.setItem('recommendedPath', JSON.stringify([]));
        localStorage.removeItem('courseRoadmap');
        navigate('/dashboard');
    };

    const handleOptionSelect = (option) => {
        setAnswers((prev) => ({ ...prev, [currentQuestion.key]: option }));
    };

    const handleNext = async () => {
        if (!selected || isLoading) {
            return;
        }

        if (step < QUESTIONS.length - 1) {
            setStep((prev) => prev + 1);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const coursesSummary = normalizedCourseList
                .map((course) => `${course.id}: ${course.title} (${course.category}, ${course.difficulty})`)
                .join('; ');

            const response = await askGeminiJSON(
                'You are a learning advisor. Return only valid JSON, no extra text.',
                `A student has these preferences: ${answersSummary}. From this course list: ${coursesSummary}, recommend the top 5 courses in the best learning order for them. Return a JSON array like: [{ id: string, title: string, reason: string }]`
            );

            const path = normalizeRecommendations(response, normalizedCourseList);
            localStorage.setItem('recommendedPath', JSON.stringify(path));
            if (onComplete) {
                onComplete(path);
            } else {
                navigate('/dashboard');
            }
        } catch {
            const fallback = normalizeRecommendations(null, normalizedCourseList);
            localStorage.setItem('recommendedPath', JSON.stringify(fallback));
            setError('AI is unavailable right now. A starter learning path was generated for you.');
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
            }
            fallbackTimeoutRef.current = setTimeout(() => {
                if (onComplete) {
                    onComplete(fallback);
                } else {
                    navigate('/dashboard');
                }
            }, 1200);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card" style={{ position: 'relative' }}>
                <button
                    onClick={handleSkip}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: 'none',
                        color: 'var(--text-muted)', fontSize: '0.85rem',
                        cursor: 'pointer', textDecoration: 'underline'
                    }}
                >
                    Skip for now
                </button>
                <p className="onboarding-step mb-2">Step {step + 1} of {QUESTIONS.length}</p>
                <ProgressBar now={progress} className="mb-4" />
                <h3 className="mb-4">{currentQuestion.label}</h3>

                <div className="d-grid gap-2">
                    {currentQuestion.options.map((option) => (
                        <Button
                            key={option}
                            type="button"
                            variant={selected === option ? 'primary' : 'outline-primary'}
                            onClick={() => handleOptionSelect(option)}
                            className="text-start"
                        >
                            {option}
                        </Button>
                    ))}
                </div>

                {error && <Alert variant="warning" className="mt-3 mb-0">{error}</Alert>}

                <div className="d-flex justify-content-between mt-4">
                    <Button
                        variant="outline-secondary"
                        onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                        disabled={step === 0 || isLoading}
                    >
                        Back
                    </Button>
                    <Button onClick={handleNext} disabled={!selected || isLoading}>
                        {isLoading ? 'Generating Path...' : step === QUESTIONS.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default OnboardingQuiz;
