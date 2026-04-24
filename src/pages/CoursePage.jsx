import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { askGemini, askGeminiJSON } from '../utils/geminiApi';
import { getCourses } from '../services/courseService';
import { logStudyActivity } from '../utils/studyActivity';

function formatTime(seconds) {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function convertToEmbedUrl(link) {
    try {
        const parsed = new URL(link);
        const host = parsed.hostname.replace('www.', '');

        if (host === 'youtu.be') {
            const id = parsed.pathname.split('/').filter(Boolean)[0];
            return id
                ? `https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
                : null;
        }

        const listId = parsed.searchParams.get('list');
        const videoId = parsed.searchParams.get('v');

        if (listId && !videoId) {
            return `https://www.youtube.com/embed/videoseries?list=${listId}&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        }

        if (parsed.pathname.startsWith('/embed/')) {
            const joiner = parsed.search ? '&' : '?';
            return `${link}${joiner}enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        }

        return null;
    } catch {
        return null;
    }
}

function extractVideoId(link) {
    try {
        const parsed = new URL(link);
        const host = parsed.hostname.replace('www.', '');

        if (host === 'youtu.be') {
            return parsed.pathname.split('/').filter(Boolean)[0] || null;
        }

        const queryVideoId = parsed.searchParams.get('v');
        if (queryVideoId) {
            return queryVideoId;
        }

        if (parsed.pathname.startsWith('/embed/')) {
            const parts = parsed.pathname.split('/').filter(Boolean);
            return parts.length >= 2 ? parts[1] : null;
        }

        return null;
    } catch {
        return null;
    }
}

function renderInlineMarkdown(text, keyPrefix) {
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return tokens.map((token, index) => {
        if (token.startsWith('**') && token.endsWith('**')) {
            return <strong key={`${keyPrefix}-bold-${index}`}>{token.slice(2, -2)}</strong>;
        }

        if (token.startsWith('`') && token.endsWith('`')) {
            return <code key={`${keyPrefix}-code-${index}`}>{token.slice(1, -1)}</code>;
        }

        return <React.Fragment key={`${keyPrefix}-txt-${index}`}>{token}</React.Fragment>;
    });
}

function renderBasicMarkdown(content, keyPrefix = 'md') {
    const lines = content.split('\n');
    const blocks = [];
    let listItems = [];

    const flushList = () => {
        if (listItems.length > 0) {
            blocks.push(
                <ul key={`${keyPrefix}-list-${blocks.length}`} className="mb-2 ps-4">
                    {listItems.map((item, index) => (
                        <li key={`${keyPrefix}-li-${index}`}>{renderInlineMarkdown(item, `${keyPrefix}-li-inline-${index}`)}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            listItems.push(trimmed.slice(2));
            return;
        }

        flushList();

        if (!trimmed) {
            return;
        }

        blocks.push(
            <p key={`${keyPrefix}-p-${blocks.length}`} className="mb-2">
                {renderInlineMarkdown(trimmed, `${keyPrefix}-p-inline-${blocks.length}`)}
            </p>
        );
    });

    flushList();

    return blocks;
}

function getQuestionTopic(questionText) {
    const normalized = (questionText || '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    const words = normalized.split(/\s+/).filter(Boolean).slice(0, 6);
    return words.join(' ') || 'general concept';
}

const YOUTUBE_IFRAME_API_SRC = 'https://www.youtube.com/iframe_api';
let youtubeIframeApiPromise = null;

function loadYouTubeIframeApi() {
    if (window.YT?.Player) {
        return Promise.resolve(window.YT);
    }

    if (!youtubeIframeApiPromise) {
        youtubeIframeApiPromise = new Promise((resolve) => {
            const existingScript = document.querySelector(`script[src="${YOUTUBE_IFRAME_API_SRC}"]`);
            const previousReady = window.onYouTubeIframeAPIReady;

            window.onYouTubeIframeAPIReady = () => {
                if (typeof previousReady === 'function') {
                    previousReady();
                }
                resolve(window.YT);
            };

            if (!existingScript) {
                const script = document.createElement('script');
                script.src = YOUTUBE_IFRAME_API_SRC;
                script.async = true;
                document.body.appendChild(script);
            }
        });
    }

    return youtubeIframeApiPromise;
}

function CoursePage() {
    const { courseId } = useParams();
    const course = useMemo(() => getCourses().find((item) => item.id === courseId), [courseId]);
    const courseTitle = course?.title || course?.name || 'Course';
    const currentVideoUrl = useMemo(() => {
        if (!course) {
            return '';
        }

        return course.youtubeUrl || course.link || '';
    }, [course]);
    const embedUrl = useMemo(() => (currentVideoUrl ? convertToEmbedUrl(currentVideoUrl) : null), [currentVideoUrl]);

    const [videoProgress, setVideoProgress] = useState({
        currentTime: 0,
        duration: 0,
        percentage: 0
    });
    const [notes, setNotes] = useState([]);
    const [notesError, setNotesError] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatError, setChatError] = useState('');
    const [quizOpen, setQuizOpen] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizError, setQuizError] = useState('');
    const [weakTopicsSaved, setWeakTopicsSaved] = useState(false);
    const [selectionPopup, setSelectionPopup] = useState({
        visible: false,
        text: '',
        x: 0,
        y: 0
    });
    const [explanationModal, setExplanationModal] = useState({
        open: false,
        loading: false,
        content: '',
        originalText: ''
    });
    const [flashcards, setFlashcards] = useState(() => {
        let parsedFlashcards = [];
        try {
            parsedFlashcards = JSON.parse(localStorage.getItem(`flashcards:${courseId}`) || '[]');
        } catch {
            parsedFlashcards = [];
            localStorage.removeItem(`flashcards:${courseId}`);
        }
        return parsedFlashcards;
    });
    const [toast, setToast] = useState({ visible: false, message: '' });

    const DRAWER_COLLAPSED_HEIGHT = 44;
    const DRAWER_DEFAULT_HEIGHT = 320;
    const DRAWER_MIN_HEIGHT = 220;
    const DRAWER_MAX_HEIGHT = 520;
    const DRAWER_STEP = 40;
    const [drawerExpandedHeight, setDrawerExpandedHeight] = useState(DRAWER_DEFAULT_HEIGHT);

    const playerRef = useRef(null);
    const notesIntervalRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const isGeneratingRef = useRef(false);
    const isPlayingRef = useRef(false);
    const lastNoteTimeRef = useRef(0);
    const notesEndRef = useRef(null);
    const chatEndRef = useRef(null);
    const toastTimeoutRef = useRef(null);

    const notesStorageKey = `courseNotes:${courseId}`;

    useEffect(() => {
        logStudyActivity();
    }, [courseId]);

    useEffect(() => {
        const cached = localStorage.getItem(notesStorageKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setNotes(parsed);
                const last = parsed[parsed.length - 1];
                lastNoteTimeRef.current = last?.endSeconds || 0;
            } catch {
                setNotes([]);
                lastNoteTimeRef.current = 0;
            }
        } else {
            setNotes([]);
            lastNoteTimeRef.current = 0;
        }
    }, [notesStorageKey]);

    useEffect(() => {
        let parsedFlashcards = [];
        try {
            parsedFlashcards = JSON.parse(localStorage.getItem(`flashcards:${courseId}`) || '[]');
        } catch {
            parsedFlashcards = [];
            localStorage.removeItem(`flashcards:${courseId}`);
        }
        setFlashcards(parsedFlashcards);
    }, [courseId]);

    useEffect(() => {
        const persistable = notes
            .filter((note) => !note.isGenerating)
            .map((note) => ({
                id: note.id,
                startTime: note.startTime,
                endTime: note.endTime,
                content: note.content,
                isGenerating: false,
                startSeconds: note.startSeconds,
                endSeconds: note.endSeconds
            }));

        localStorage.setItem(notesStorageKey, JSON.stringify(persistable));
    }, [notes, notesStorageKey]);

    useEffect(() => {
        notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [notes.length]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, isTyping]);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!course || !embedUrl) {
            return undefined;
        }

        let isDisposed = false;

        const clearIntervals = () => {
            if (notesIntervalRef.current) {
                clearInterval(notesIntervalRef.current);
                notesIntervalRef.current = null;
            }

            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };

        const updateProgress = () => {
            if (!playerRef.current) {
                return;
            }

            const currentTime = Number(playerRef.current.getCurrentTime?.() || 0);
            const duration = Number(playerRef.current.getDuration?.() || 0);
            const percentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
            setVideoProgress({ currentTime, duration, percentage });
        };

        const generateSegmentNotes = async () => {
            if (!course || !isPlayingRef.current || isGeneratingRef.current || !playerRef.current) {
                return;
            }

            const currentTime = Number(playerRef.current.getCurrentTime?.() || 0);
            const startTime = lastNoteTimeRef.current;

            if (currentTime <= startTime + 3) {
                return;
            }

            isGeneratingRef.current = true;
            setNotesError('');

            const noteId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const pendingNote = {
                id: noteId,
                startSeconds: startTime,
                endSeconds: currentTime,
                startTime: formatTime(startTime),
                endTime: formatTime(currentTime),
                content: '',
                isGenerating: true
            };

            setNotes((prev) => [...prev, pendingNote]);

            try {
                const aiContent = await askGemini(
                    'You are a smart note-taking assistant for an online learning platform. Generate concise, student-friendly notes for a video segment. Use markdown: **bold** for key terms, bullet points for lists, backticks for inline code. Keep each note block under 80 words.',
                    `Course: ${course.name}. Category: ${course.category}. Video timestamp: ${formatTime(startTime)} to ${formatTime(currentTime)}. Generate notes for this segment based on the course topic.`
                );

                setNotes((prev) => prev.map((note) => (
                    note.id === noteId
                        ? { ...note, content: aiContent, isGenerating: false }
                        : note
                )));
                lastNoteTimeRef.current = currentTime;
            } catch {
                setNotes((prev) => prev.map((note) => (
                    note.id === noteId
                        ? {
                            ...note,
                            content: 'AI is unavailable right now. Please try again.',
                            isGenerating: false
                        }
                        : note
                )));
                setNotesError('AI is unavailable right now. Please try again.');
            } finally {
                isGeneratingRef.current = false;
            }
        };

        const startIntervals = () => {
            clearIntervals();
            progressIntervalRef.current = setInterval(updateProgress, 1000);
            notesIntervalRef.current = setInterval(generateSegmentNotes, 30000);
        };

        const markCourseCompleted = () => {
            const currentVideoId = extractVideoId(course.youtubeUrl || course.link || '');

            if (!currentVideoId) {
                return;
            }

            let completedCourses = [];
            try {
                completedCourses = JSON.parse(localStorage.getItem('completedCourses') || '[]');
            } catch {
                completedCourses = [];
                localStorage.removeItem('completedCourses');
            }
            if (!completedCourses.includes(courseId)) {
                localStorage.setItem('completedCourses', JSON.stringify([...completedCourses, courseId]));
            }
        };

        const onPlayerStateChange = (event) => {
            const ytState = window.YT?.PlayerState;

            if (!ytState) {
                return;
            }

            if (event.data === ytState.PLAYING) {
                isPlayingRef.current = true;
                updateProgress();
                startIntervals();
                return;
            }

            if (event.data === ytState.PAUSED || event.data === ytState.ENDED) {
                isPlayingRef.current = false;
                clearIntervals();
                updateProgress();

                if (event.data === ytState.ENDED) {
                    markCourseCompleted();
                }
            }
        };

        const initPlayer = () => {
            const container = document.getElementById('course-youtube-player');
            if (isDisposed || !container || !window.YT?.Player) {
                return;
            }

            if (playerRef.current?.destroy) {
                playerRef.current.destroy();
            }

            playerRef.current = new window.YT.Player('course-youtube-player', {
                events: {
                    onReady: () => {
                        updateProgress();
                    },
                    onStateChange: onPlayerStateChange
                }
            });
        };

        loadYouTubeIframeApi().then(() => {
            initPlayer();
        });

        return () => {
            isDisposed = true;
            isPlayingRef.current = false;
            clearIntervals();
            if (playerRef.current?.destroy) {
                playerRef.current.destroy();
            }
            playerRef.current = null;
        };
    }, [course, embedUrl, courseId]);

    const handleSendMessage = async () => {
        const trimmed = inputText.trim();
        if (!trimmed || !course || isTyping) {
            return;
        }

        setChatError('');
        setInputText('');

        const userMessage = { role: 'user', content: trimmed };
        const conversationSeed = messages.slice(-10);
        setMessages((prev) => [...prev, userMessage].slice(-20));
        setIsTyping(true);

        try {
            const aiReply = await askGemini(
                `You are a helpful AI tutor for the course '${course.name}' on CodeCampus. The student is at timestamp ${formatTime(videoProgress.currentTime)} in the video. Answer questions clearly and concisely. Use code examples when relevant.`,
                trimmed,
                conversationSeed
            );

            setMessages((prev) => [...prev, { role: 'assistant', content: aiReply }].slice(-20));
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'AI is unavailable right now. Please try again.' }
            ].slice(-20));
            setChatError('AI is unavailable right now. Please try again.');
        } finally {
            setIsTyping(false);
        }
    };

    const handleInputKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const resetQuizState = () => {
        setQuizOpen(false);
        setQuizQuestions([]);
        setQuizLoading(false);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizIndex(0);
        setQuizError('');
        setWeakTopicsSaved(false);
    };

    const hideSelectionPopup = () => {
        setSelectionPopup({ visible: false, text: '', x: 0, y: 0 });
    };

    const showToast = (message) => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }

        setToast({ visible: true, message });
        toastTimeoutRef.current = setTimeout(() => {
            setToast({ visible: false, message: '' });
        }, 2500);
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim() || '';

        if (selectedText.length > 3 && selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelectionPopup({
                visible: true,
                text: selectedText,
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
            return;
        }

        hideSelectionPopup();
    };

    const handleSaveFlashcard = (text) => {
        const trimmed = text?.trim();
        if (!trimmed) {
            return;
        }

        hideSelectionPopup();

        const newCard = {
            id: Date.now(),
            front: trimmed,
            courseId: courseId,
            courseName: course?.title || course?.name || 'CodeCampus',
            savedAt: new Date().toISOString()
        };

        const updated = [...flashcards, newCard];
        setFlashcards(updated);
        localStorage.setItem(`flashcards:${courseId}`, JSON.stringify(updated));
        showToast('Flashcard saved!');
    };

    const handleExplainMore = async (text) => {
        const trimmed = text?.trim();
        if (!trimmed) {
            return;
        }

        hideSelectionPopup();
        setExplanationModal({ open: true, loading: true, content: '', originalText: trimmed });

        try {
            const response = await askGemini(
                `You are a helpful tutor. Explain concepts clearly for a student learning ${course?.name || 'this course'}. Keep your explanation under 150 words, use simple language, and give a short code example if relevant.`,
                `Explain this in more detail: "${trimmed}"`
            );

            setExplanationModal({
                open: true,
                loading: false,
                content: response,
                originalText: trimmed
            });
        } catch {
            setExplanationModal({
                open: true,
                loading: false,
                content: 'Could not generate explanation. Please try again.',
                originalText: trimmed
            });
        }
    };

    const handleGenerateQuiz = async () => {
        if (notes.length < 2) {
            return;
        }

        setQuizOpen(true);
        setQuizLoading(true);
        setQuizQuestions([]);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizIndex(0);
        setQuizError('');
        setWeakTopicsSaved(false);

        const notesText = notes
            .filter((note) => !note.isGenerating && note.content)
            .map((note) => note.content)
            .join('\n\n');

        try {
            const result = await askGeminiJSON(
                'You are a quiz generator. Return only valid JSON, no markdown, no extra text.',
                `Based on these course notes from the course '${course.name}':\n${notesText}\nGenerate exactly 5 multiple choice questions to test understanding. Return this exact JSON format: { questions: [ { id: 1, question: string, options: { A: string, B: string, C: string, D: string }, correct: 'A' or 'B' or 'C' or 'D', explanation: string } ] }`
            );

            const questions = Array.isArray(result?.questions) ? result.questions.slice(0, 5) : [];
            if (questions.length === 0) {
                throw new Error('Invalid quiz payload');
            }

            const normalized = questions.map((q, index) => ({
                id: q.id ?? index + 1,
                question: q.question || 'Untitled question',
                options: q.options || { A: '', B: '', C: '', D: '' },
                correct: q.correct || 'A',
                explanation: q.explanation || 'No explanation provided.'
            }));

            setQuizQuestions(normalized);
        } catch {
            setQuizError('AI is unavailable right now. Please try again.');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleSelectAnswer = (question, selectedOption) => {
        setQuizAnswers((previous) => ({
            ...previous,
            [question.id]: selectedOption
        }));
    };

    const handleSaveWeakTopics = () => {
        const existingRaw = localStorage.getItem(`weakTopics:${courseId}`) || '';
        const existing = existingRaw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        const generatedWeakTopics = quizQuestions
            .filter((question) => quizAnswers[question.id] && quizAnswers[question.id] !== question.correct)
            .map((question) => getQuestionTopic(question.question));

        const merged = [...new Set([...existing, ...generatedWeakTopics])];
        localStorage.setItem(`weakTopics:${courseId}`, merged.join(','));
        setWeakTopicsSaved(true);
    };

    const currentQuestion = quizQuestions[quizIndex];
    const selectedAnswer = currentQuestion ? quizAnswers[currentQuestion.id] : null;
    const hasAnsweredCurrent = Boolean(selectedAnswer);
    const isCurrentCorrect = currentQuestion ? selectedAnswer === currentQuestion.correct : false;
    const allAnswered = quizQuestions.length > 0 && quizQuestions.every((question) => quizAnswers[question.id]);
    const score = quizQuestions.reduce((total, question) => (
        quizAnswers[question.id] === question.correct ? total + 1 : total
    ), 0);

    const clampDrawerHeight = (value) => Math.min(DRAWER_MAX_HEIGHT, Math.max(DRAWER_MIN_HEIGHT, value));

    const adjustDrawerHeight = (delta) => {
        setDrawerExpandedHeight((previous) => clampDrawerHeight(previous + delta));
    };

    const resetDrawerHeight = () => {
        setDrawerExpandedHeight(DRAWER_DEFAULT_HEIGHT);
    };

    if (!course) {
        return (
            <Container className="mt-4">
                <Alert variant="warning" className="mb-3">
                    Course not found.
                </Alert>
                <Button as={Link} to="/courses" variant="primary">Back to Courses</Button>
            </Container>
        );
    }

    if (!embedUrl) {
        return (
            <Container className="mt-4">
                <Alert variant="warning" className="mb-3">
                    Unable to load this course video inside the app.
                </Alert>
                <Button as={Link} to="/courses" variant="primary">Back to Courses</Button>
            </Container>
        );
    }

    return (
        <div onClick={hideSelectionPopup} className={`course-layout-root course-study-page ${isOpen ? 'qa-open' : ''}`}>
            <Container fluid className="course-study-container">
                <div className="course-layout-main">
                    <div className="course-video-pane">
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column course-video-card-body">
                                <div className="course-video-frame-shell">
                                    <iframe
                                        id="course-youtube-player"
                                        title={course.name}
                                        src={embedUrl}
                                        className="course-video-frame no-transition"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                    ></iframe>
                                </div>

                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                                    <h5 className="mb-0">{courseTitle}</h5>
                                    <small className="text-muted text-end">{course.category} • {course.difficulty}</small>
                                </div>

                            </Card.Body>
                        </Card>
                    </div>

                    <div onClick={(event) => event.stopPropagation()} className="course-notes-pane">
                        <Card className="h-100 course-notes-panel course-notes-card" id="course-notes-print">
                            <Card.Header className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                                <div className="d-flex align-items-center gap-2">
                                    <strong>AI Notes</strong>
                                    <span className="live-badge">● Live</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant={notes.length >= 2 ? 'outline-secondary' : 'outline-secondary'}
                                        disabled={notes.length < 2}
                                        onClick={handleGenerateQuiz}
                                        title={notes.length < 2 ? 'Watch more to generate a quiz' : 'Generate Quiz'}
                                    >
                                        Generate Quiz
                                    </Button>
                                    <Button size="sm" variant="outline-success" onClick={() => window.print()}>
                                        Download Notes
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body
                                onMouseUp={handleTextSelection}
                                className="course-notes-scroll"
                            >
                                {notes.length === 0 && (
                                    <p className="text-muted mb-0">Play the video to generate live notes every 30 seconds.</p>
                                )}

                                {notesError && <Alert variant="warning">{notesError}</Alert>}

                                {notes.map((note) => (
                                    <article key={note.id} className="note-item">
                                        <div className="note-time font-monospace mb-2">
                                            {note.startTime} - {note.endTime}
                                        </div>
                                        {note.isGenerating ? (
                                            <div className="note-generating">
                                                <span className="pulse-dot"></span>
                                                <span className="pulse-dot"></span>
                                                <span className="pulse-dot"></span>
                                            </div>
                                        ) : (
                                            <div className="note-content">{renderBasicMarkdown(note.content, `note-${note.id}`)}</div>
                                        )}
                                    </article>
                                ))}
                                <div ref={notesEndRef}></div>
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                <div
                    className="qa-drawer-shell"
                    style={{ '--drawer-height': `${isOpen ? drawerExpandedHeight : DRAWER_COLLAPSED_HEIGHT}px` }}
                >
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                        className="qa-drawer-toggle"
                    >
                        <span>AI Q&A Assistant — ask anything about this lesson</span>
                        <span className="d-flex align-items-center gap-2">
                            {isOpen && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            adjustDrawerHeight(-DRAWER_STEP);
                                        }}
                                        title="Decrease drawer height"
                                    >
                                        -
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            adjustDrawerHeight(DRAWER_STEP);
                                        }}
                                        title="Increase drawer height"
                                    >
                                        +
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            resetDrawerHeight();
                                        }}
                                        title="Reset drawer height"
                                    >
                                        Reset
                                    </Button>
                                </>
                            )}
                            <span>{isOpen ? '▼' : '▲'}</span>
                        </span>
                    </div>

                    <div className="qa-content-wrap">
                        <div className="qa-header d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Lesson Q&A</h6>
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => setMessages([])}
                                disabled={messages.length === 0 && !isTyping}
                            >
                                Clear chat
                            </Button>
                        </div>

                        <div className="qa-messages">
                            {messages.length === 0 && !isTyping ? (
                                <p className="text-muted mb-0">Ask your first question about this lesson.</p>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={`${msg.role}-${index}`} className={`qa-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                                        {msg.role === 'assistant' && <span className="qa-avatar">AI</span>}
                                        <div className="qa-bubble">{renderBasicMarkdown(msg.content, `chat-${index}`)}</div>
                                    </div>
                                ))
                            )}

                            {isTyping && (
                                <div className="qa-message ai">
                                    <span className="qa-avatar">AI</span>
                                    <div className="qa-bubble typing-row">
                                        <Spinner animation="grow" size="sm" />
                                        <Spinner animation="grow" size="sm" />
                                        <Spinner animation="grow" size="sm" />
                                    </div>
                                </div>
                            )}

                            {chatError && <small className="text-warning d-block mt-2">{chatError}</small>}
                            <div ref={chatEndRef}></div>
                        </div>

                        <Form className="qa-input-row" onSubmit={(event) => { event.preventDefault(); handleSendMessage(); }}>
                            <Form.Control
                                value={inputText}
                                onChange={(event) => setInputText(event.target.value)}
                                onKeyDown={handleInputKeyDown}
                                placeholder="Ask a question about this lesson..."
                            />
                            <Button type="submit" variant="primary" disabled={isTyping || !inputText.trim()}>Send</Button>
                        </Form>
                    </div>
                </div>
            </Container>

            {selectionPopup.visible && (
                <div
                    onClick={(event) => event.stopPropagation()}
                    className="selection-popup"
                    style={{ '--popup-x': `${selectionPopup.x}px`, '--popup-y': `${selectionPopup.y}px` }}
                >
                    <button
                        type="button"
                        onClick={() => handleExplainMore(selectionPopup.text)}
                        className="selection-popup-btn explain"
                    >
                        Explain more
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSaveFlashcard(selectionPopup.text)}
                        className="selection-popup-btn flashcard"
                    >
                        Save flashcard
                    </button>
                </div>
            )}

            {explanationModal.open && (
                <div
                    className="overlay-modal"
                    onClick={() => setExplanationModal({ open: false, loading: false, content: '', originalText: '' })}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="overlay-card"
                    >
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="mb-0">Explanation</h6>
                            <button
                                type="button"
                                aria-label="Close explanation"
                                onClick={() => setExplanationModal({ open: false, loading: false, content: '', originalText: '' })}
                                className="overlay-close-btn"
                            >
                                ×
                            </button>
                        </div>

                        <div className="overlay-quote">
                            "{explanationModal.originalText}"
                        </div>

                        {explanationModal.loading ? (
                            <div className="d-flex align-items-center gap-2 py-2">
                                <Spinner size="sm" animation="border" />
                                <span>Generating explanation...</span>
                            </div>
                        ) : (
                            <div className="overlay-content-scroll">
                                {renderBasicMarkdown(explanationModal.content || '', 'selection-explain')}
                            </div>
                        )}

                        <div className="d-flex justify-content-end mt-3">
                            <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleSaveFlashcard(explanationModal.originalText)}
                            >
                                Save as flashcard
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`selection-toast ${toast.visible ? 'show' : ''}`}
                role="status"
                aria-live="polite"
            >
                {toast.message}
            </div>

            {quizOpen && (
                <div
                    className="quiz-overlay"
                    onClick={resetQuizState}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="quiz-card"
                    >
                        <button
                            type="button"
                            onClick={resetQuizState}
                            aria-label="Close quiz"
                            className="quiz-close-btn"
                        >
                            ×
                        </button>

                        <h5 className="mb-3">Notes Quiz</h5>

                        {quizLoading && (
                            <div className="text-center py-4">
                                <Spinner animation="border" />
                                <p className="mb-0 mt-2">Generating quiz from your notes...</p>
                            </div>
                        )}

                        {!quizLoading && quizError && (
                            <Alert variant="warning" className="mb-0">
                                {quizError}
                            </Alert>
                        )}

                        {!quizLoading && !quizError && !quizSubmitted && currentQuestion && (
                            <>
                                <p className="text-muted mb-2">Question {quizIndex + 1} of {quizQuestions.length}</p>
                                <h6 className="mb-3">{currentQuestion.question}</h6>
                                <div className="d-grid gap-2">
                                    {['A', 'B', 'C', 'D'].map((optionKey) => {
                                        let variant = 'outline-primary';

                                        if (hasAnsweredCurrent) {
                                            if (optionKey === currentQuestion.correct) {
                                                variant = 'success';
                                            } else if (optionKey === selectedAnswer) {
                                                variant = 'danger';
                                            }
                                        }

                                        return (
                                            <Button
                                                key={optionKey}
                                                variant={variant}
                                                className="text-start"
                                                onClick={() => handleSelectAnswer(currentQuestion, optionKey)}
                                                disabled={hasAnsweredCurrent}
                                            >
                                                <strong>{optionKey}.</strong> {currentQuestion.options?.[optionKey]}
                                            </Button>
                                        );
                                    })}
                                </div>

                                {hasAnsweredCurrent && (
                                    <div
                                        className={`mt-3 p-2 rounded quiz-feedback ${isCurrentCorrect ? 'correct' : 'incorrect'}`}
                                    >
                                        <strong>{isCurrentCorrect ? 'Correct.' : 'Not quite.'}</strong> {currentQuestion.explanation}
                                    </div>
                                )}

                                {hasAnsweredCurrent && (
                                    <div className="d-flex justify-content-end mt-3">
                                        {quizIndex < quizQuestions.length - 1 ? (
                                            <Button onClick={() => setQuizIndex((prev) => prev + 1)}>
                                                Next Question
                                            </Button>
                                        ) : (
                                            <Button onClick={() => setQuizSubmitted(true)} disabled={!allAnswered}>
                                                See Results
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {!quizLoading && !quizError && quizSubmitted && (
                            <>
                                <h6 className="mb-2">Score: {score} / {quizQuestions.length}</h6>
                                <div className="mb-3">
                                    {quizQuestions.map((question) => {
                                        const isCorrect = quizAnswers[question.id] === question.correct;
                                        return (
                                            <div key={question.id} className="border rounded p-2 mb-2">
                                                <div className="d-flex align-items-start gap-2">
                                                    <span>{isCorrect ? '✅' : '❌'}</span>
                                                    <div>
                                                        <p className="mb-1"><strong>{question.question}</strong></p>
                                                        <small className="text-muted">Correct answer: {question.correct}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="d-flex justify-content-between flex-wrap gap-2">
                                    <Button
                                        variant={weakTopicsSaved ? 'success' : 'outline-warning'}
                                        onClick={handleSaveWeakTopics}
                                        disabled={weakTopicsSaved}
                                    >
                                        {weakTopicsSaved ? 'Weak topics saved' : 'Save weak topics'}
                                    </Button>
                                    <Button variant="secondary" onClick={resetQuizState}>Close Quiz</Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CoursePage;
