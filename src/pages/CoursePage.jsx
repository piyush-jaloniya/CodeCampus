import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
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
    const hasPlaylist = Boolean(Array.isArray(course?.videos) && course.videos.length > 0);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [completedVideos, setCompletedVideos] = useState(() => {
        let parsedCompletedVideos = [];
        try {
            parsedCompletedVideos = JSON.parse(localStorage.getItem(`completedVideos:${courseId}`) || '[]');
        } catch {
            parsedCompletedVideos = [];
            localStorage.removeItem(`completedVideos:${courseId}`);
        }
        return parsedCompletedVideos;
    });
    const currentVideoUrl = useMemo(() => {
        if (!course) {
            return '';
        }

        if (hasPlaylist) {
            const activeVideo = course.videos[activeVideoIndex] || course.videos[0];
            return activeVideo ? `https://www.youtube.com/watch?v=${activeVideo.videoId}` : '';
        }

        return course.youtubeUrl || course.link || '';
    }, [course, hasPlaylist, activeVideoIndex]);
    const embedUrl = useMemo(() => (currentVideoUrl ? convertToEmbedUrl(currentVideoUrl) : null), [currentVideoUrl]);
    const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 768);

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
        let parsedCompletedVideos = [];
        try {
            parsedCompletedVideos = JSON.parse(localStorage.getItem(`completedVideos:${courseId}`) || '[]');
        } catch {
            parsedCompletedVideos = [];
            localStorage.removeItem(`completedVideos:${courseId}`);
        }
        setCompletedVideos(parsedCompletedVideos);
        setActiveVideoIndex(0);
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
        const onResize = () => setIsNarrow(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

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

        const handleVideoSwitch = (nextIndex) => {
            if (!hasPlaylist) {
                return;
            }

            if (nextIndex < 0 || nextIndex >= course.videos.length) {
                return;
            }

            setActiveVideoIndex(nextIndex);
        };

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
            const currentVideoId = hasPlaylist
                ? course.videos[activeVideoIndex]?.videoId
                : extractVideoId(course.youtubeUrl || course.link || '');

            if (!currentVideoId) {
                return;
            }

            const completedVideosKey = `completedVideos:${courseId}`;
            let stored = [];
            try {
                stored = JSON.parse(localStorage.getItem(completedVideosKey) || '[]');
            } catch {
                stored = [];
                localStorage.removeItem(completedVideosKey);
            }

            if (!stored.includes(currentVideoId)) {
                stored.push(currentVideoId);
                localStorage.setItem(completedVideosKey, JSON.stringify(stored));
                setCompletedVideos(stored);
            }

            if (hasPlaylist && activeVideoIndex < course.videos.length - 1) {
                handleVideoSwitch(activeVideoIndex + 1);
            }

            const allCourseVideoIds = hasPlaylist
                ? course.videos.map((video) => video.videoId).filter(Boolean)
                : [currentVideoId];

            const allVideosWatched = allCourseVideoIds.every((videoId) => stored.includes(videoId));
            if (!allVideosWatched) {
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
    }, [course, embedUrl, courseId, hasPlaylist, activeVideoIndex]);

    const handleVideoSwitch = (nextIndex) => {
        if (!course || !hasPlaylist) {
            return;
        }

        if (nextIndex < 0 || nextIndex >= course.videos.length) {
            return;
        }

        setActiveVideoIndex(nextIndex);
    };

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
        <div
            onClick={hideSelectionPopup}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden',
                paddingTop: '60px'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    flexDirection: isNarrow ? 'column' : 'row',
                    gap: '12px',
                    padding: '12px'
                }}
            >
                <div
                    style={{
                        flex: isNarrow ? '1 1 100%' : '3 1 0%',
                        height: '100%',
                        overflow: 'hidden',
                        minHeight: 0
                    }}
                >
                    <Card className="h-100">
                        <Card.Body className="d-flex flex-column" style={{ minHeight: 0 }}>
                            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', borderRadius: '12px', backgroundColor: '#020617' }}>
                                <iframe
                                    id="course-youtube-player"
                                    title={course.name}
                                    src={embedUrl}
                                    className="no-transition"
                                    style={{ width: '100%', height: '100%', border: 0 }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                ></iframe>
                            </div>

                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                                <div>
                                    <h5 className="mb-1">{course.name}</h5>
                                    <small className="text-muted">{course.category} • {course.difficulty}</small>
                                </div>
                                <Badge bg="primary">{course.duration}</Badge>
                            </div>

                            <div className="progress-readout mt-3">
                                <span className="font-monospace">
                                    {formatTime(videoProgress.currentTime)} / {formatTime(videoProgress.duration)}
                                </span>
                                <span>{Math.round(videoProgress.percentage)}% watched</span>
                            </div>
                            <div className="progress mt-2" style={{ height: '8px' }}>
                                <div
                                    className="progress-bar bg-success"
                                    role="progressbar"
                                    style={{ width: `${videoProgress.percentage}%` }}
                                    aria-valuenow={videoProgress.percentage}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>

                            {hasPlaylist && (
                                <div className="mt-3" style={{ border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
                                        Playlist
                                    </div>
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '8px 10px' }}>
                                        {course.videos.map((video, index) => {
                                            const isActiveVideo = index === activeVideoIndex;
                                            const isCompletedVideo = completedVideos.includes(video.videoId);

                                            return (
                                                <button
                                                    key={video.id}
                                                    type="button"
                                                    onClick={() => handleVideoSwitch(index)}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        marginBottom: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        padding: '8px 10px',
                                                        background: isActiveVideo ? 'var(--accent-bg)' : 'transparent',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.87rem'
                                                    }}
                                                >
                                                    <span style={{ color: isCompletedVideo ? 'var(--success)' : 'var(--text-secondary)', marginRight: '8px' }}>
                                                        {isCompletedVideo ? '✓' : '○'}
                                                    </span>
                                                    {video.title}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleVideoSwitch(activeVideoIndex - 1)}
                                            disabled={activeVideoIndex === 0}
                                        >
                                            ← Previous
                                        </button>
                                        <span style={{ fontSize: '11px', color: '#8892b0' }}>
                                            {activeVideoIndex + 1} / {course.videos.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleVideoSwitch(activeVideoIndex + 1)}
                                            disabled={activeVideoIndex === course.videos.length - 1}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>

                <div
                    onClick={(event) => event.stopPropagation()}
                    style={{
                        flex: isNarrow ? '1 1 100%' : '2 1 0%',
                        height: '100%',
                        overflow: 'hidden',
                        minHeight: 0
                    }}
                >
                    <Card className="h-100 course-notes-panel" id="course-notes-print" style={{ minHeight: 0 }}>
                        <Card.Header className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                            <div className="d-flex align-items-center gap-2">
                                <strong>AI Notes</strong>
                                <span className="live-badge">● Live</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={notes.length >= 2 ? 'outline-info' : 'outline-secondary'}
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
                            style={{ height: '100%', overflowY: 'auto' }}
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
                style={{
                    flexShrink: 0,
                    height: isOpen ? drawerExpandedHeight : DRAWER_COLLAPSED_HEIGHT,
                    transition: 'height 0.3s ease',
                    overflow: 'hidden',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0b1120'
                }}
            >
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        height: 44,
                        flexShrink: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px',
                        color: 'var(--text-primary)',
                        fontWeight: 600
                    }}
                >
                    <span>AI Q&A Assistant — ask anything about this lesson</span>
                    <span className="d-flex align-items-center gap-2">
                        {isOpen && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline-light"
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
                                    variant="outline-light"
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
                                    variant="outline-light"
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

                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="qa-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Lesson Q&A</h6>
                        <Button
                            size="sm"
                            variant="outline-light"
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
                        <Button type="submit" disabled={isTyping || !inputText.trim()}>Send</Button>
                    </Form>
                </div>
            </div>

            {selectionPopup.visible && (
                <div
                    onClick={(event) => event.stopPropagation()}
                    style={{
                        position: 'fixed',
                        left: selectionPopup.x,
                        top: selectionPopup.y,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 999,
                        background: '#1a2235',
                        border: '1px solid rgba(79,142,247,0.3)',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        display: 'flex',
                        gap: '6px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                    }}
                >
                    <button
                        type="button"
                        onClick={() => handleExplainMore(selectionPopup.text)}
                        style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}
                    >
                        Explain more
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSaveFlashcard(selectionPopup.text)}
                        style={{
                            background: '#0f766e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}
                    >
                        Save flashcard
                    </button>
                </div>
            )}

            {explanationModal.open && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1001,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => setExplanationModal({ open: false, loading: false, content: '', originalText: '' })}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: '92%',
                            maxWidth: '480px',
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.28)'
                        }}
                    >
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="mb-0">Explanation</h6>
                            <button
                                type="button"
                                aria-label="Close explanation"
                                onClick={() => setExplanationModal({ open: false, loading: false, content: '', originalText: '' })}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1.2rem',
                                    lineHeight: 1,
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div
                            style={{
                                borderLeft: '4px solid #4f8ef7',
                                background: '#eef4ff',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                marginBottom: '12px',
                                color: '#1e293b',
                                fontStyle: 'italic'
                            }}
                        >
                            "{explanationModal.originalText}"
                        </div>

                        {explanationModal.loading ? (
                            <div className="d-flex align-items-center gap-2 py-2">
                                <Spinner size="sm" animation="border" />
                                <span>Generating explanation...</span>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
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
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        background: 'rgba(0,0,0,0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={resetQuizState}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: '90%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '16px',
                            position: 'relative'
                        }}
                    >
                        <button
                            type="button"
                            onClick={resetQuizState}
                            aria-label="Close quiz"
                            style={{
                                position: 'absolute',
                                top: 10,
                                right: 12,
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1.25rem',
                                cursor: 'pointer'
                            }}
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
                                        className="mt-3 p-2 rounded"
                                        style={{
                                            background: isCurrentCorrect ? '#dcfce7' : '#fee2e2',
                                            color: isCurrentCorrect ? '#166534' : '#991b1b',
                                            border: `1px solid ${isCurrentCorrect ? '#86efac' : '#fca5a5'}`
                                        }}
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
