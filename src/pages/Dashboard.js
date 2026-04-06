import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, Badge, Alert, Button } from 'react-bootstrap';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import { getCourses } from '../services/courseService';
import StudyHeatmap from '../components/StudyHeatmap';
import { askGeminiJSON } from '../utils/geminiApi';

const stageColorMap = {
    blue: '#4f8ef7',
    purple: '#7c3aed',
    green: '#06d6a0',
    amber: '#f7a525'
};

function StageCard({ stage, completedCourses }) {
    const color = stageColorMap[stage?.color] || stageColorMap.blue;
    const stageCourses = Array.isArray(stage?.courses) ? stage.courses : [];
    const isComplete = stageCourses.length > 0 && stageCourses.every((course) => completedCourses.includes(course.id));

    return (
        <Card
            className="dashboard-card"
            style={{
                minWidth: '220px',
                maxWidth: '260px',
                flexShrink: 0,
                borderTop: `4px solid ${color}`
            }}
        >
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <Badge style={{ backgroundColor: color }}>{`Stage ${stage?.stageNumber || '-'}`}</Badge>
                    {isComplete && (
                        <span aria-label="Stage completed" style={{ color: '#16a34a', fontSize: '1.1rem', fontWeight: 700 }}>
                            ✓
                        </span>
                    )}
                </div>
                <h6 className="mb-1">{stage?.stageTitle || 'Learning Stage'}</h6>
                <small className="text-muted d-block mb-3">{stage?.stageDescription || 'Continue learning step by step.'}</small>

                <div className="d-flex flex-column gap-2">
                    {stageCourses.map((course, index) => (
                        <div key={`${course.id}-${index}`}>
                            <div className="small fw-semibold mb-1">• {course.title}</div>
                            <div className="d-flex flex-wrap gap-1">
                                {(course.skillsGained || []).slice(0, 2).map((skill, skillIndex) => (
                                    <Badge key={`${course.id}-skill-${skillIndex}`} bg="light" text="dark" className="border">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
}

export function startTour() {
    const rawSteps = [
        {
            title: 'Welcome to CodeCampus!',
            intro: 'Let us show you around. This quick tour will help you get the most out of the platform.'
        },
        {
            element: document.querySelector('.dashboard-greeting'),
            title: 'Your Dashboard',
            intro: 'This is your personal dashboard. It shows your progress, streaks, and recommended courses.'
        },
        {
            element: document.querySelector('.learning-path-section'),
            title: 'Your AI Learning Path',
            intro: 'Based on your interests, our AI has curated a personalized learning path just for you.'
        },
        {
            element: document.querySelector('.heatmap-section'),
            title: 'Study Streak',
            intro: 'Track your daily learning activity here. Consistency is key — try to keep your streak going!'
        },
        {
            element: document.querySelector('.weak-topics-section'),
            title: 'Topics to Review',
            intro: 'The AI tracks which topics you struggled with in quizzes and reminds you to revisit them.'
        },
        {
            element: document.querySelector('.nav-courses-link'),
            title: 'Browse Courses',
            intro: 'Explore all available courses here. Each course opens in our in-app player with live AI notes.'
        },
        {
            title: 'You are all set!',
            intro: 'You can restart this tour anytime from the Help menu. Happy learning!'
        }
    ];

    const steps = rawSteps.filter((step) => !step.element || document.body.contains(step.element));

    introJs().setOptions({
        steps,
        showProgress: true,
        showBullets: true,
        exitOnOverlayClick: false,
        nextLabel: 'Next →',
        prevLabel: '← Back',
        doneLabel: 'Start Learning',
        overlayOpacity: 0.6,
        tooltipClass: 'codecampus-tour-tooltip'
    }).oncomplete(() => {
        localStorage.setItem('hasSeenTour', 'true');
    }).onexit(() => {
        localStorage.setItem('hasSeenTour', 'true');
    }).start();
}

function Dashboard({ user, wishlist }) {
    const [roadmap, setRoadmap] = useState(() => {
        let parsedRoadmap = {};
        try {
            parsedRoadmap = JSON.parse(localStorage.getItem('courseRoadmap') || '{}');
        } catch {
            parsedRoadmap = {};
            localStorage.removeItem('courseRoadmap');
        }
        return parsedRoadmap;
    });
    const [roadmapLoading, setRoadmapLoading] = useState(false);
    const wishlistCount = wishlist.length;
    let recommendedPath = [];
    try {
        recommendedPath = JSON.parse(localStorage.getItem('recommendedPath') || '[]');
    } catch {
        recommendedPath = [];
        localStorage.removeItem('recommendedPath');
    }

    let completedCourses = [];
    try {
        completedCourses = JSON.parse(localStorage.getItem('completedCourses') || '[]');
    } catch {
        completedCourses = [];
        localStorage.removeItem('completedCourses');
    }
    const allCourses = getCourses();
    const weakTopicsByCourse = allCourses
        .map((course) => {
            const raw = localStorage.getItem(`weakTopics:${course.id}`) || '';
            const topics = raw
                .split(',')
                .map((topic) => topic.trim())
                .filter(Boolean);

            return {
                id: course.id,
                name: course.name,
                topics
            };
        })
        .filter((item) => item.topics.length > 0);

    const getRankLabel = (index) => {
        if (index === 0) return '1st';
        if (index === 1) return '2nd';
        if (index === 2) return '3rd';
        return `${index + 1}th`;
    };

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => startTour(), 800);
            return () => clearTimeout(timer);
        }

        return undefined;
    }, []);

    useEffect(() => {
        if (recommendedPath.length === 0 && roadmap?.stages?.length > 0) {
            localStorage.removeItem('courseRoadmap');
            setRoadmap(null);
        }
    }, [recommendedPath.length, roadmap]);

    const generateRoadmap = async (path) => {
        if (!path || path.length === 0) {
            return;
        }

        setRoadmapLoading(true);
        try {
            const result = await askGeminiJSON(
                'You are a learning path designer. Return only valid JSON, no extra text.',
                `Given these courses in order: ${JSON.stringify(path)}, create a skill roadmap with stages. Return this exact JSON: { stages: [ { stageNumber: 1, stageTitle: string, stageDescription: string (max 10 words), courses: [{ id: string, title: string, skillsGained: [string, string] }], color: one of: "blue" | "purple" | "green" | "amber" } ] } Group the courses into 3 to 4 logical stages like Foundations, Core Skills, Advanced Topics, Mastery. Each stage has 1 to 3 courses.`
            );

            setRoadmap(result);
            localStorage.setItem('courseRoadmap', JSON.stringify(result));
        } catch (error) {
            console.error('Roadmap generation failed', error);
        } finally {
            setRoadmapLoading(false);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('courseRoadmap');
        let path = [];
        try {
            path = JSON.parse(localStorage.getItem('recommendedPath') || '[]');
        } catch {
            path = [];
            localStorage.removeItem('recommendedPath');
        }
        if (!saved && path.length > 0) {
            generateRoadmap(path);
        }
    }, []);

    const handleRegenerateRoadmap = () => {
        localStorage.removeItem('courseRoadmap');
        setRoadmap(null);
        let path = [];
        try {
            path = JSON.parse(localStorage.getItem('recommendedPath') || '[]');
        } catch {
            path = [];
            localStorage.removeItem('recommendedPath');
        }
        if (path.length > 0) {
            generateRoadmap(path);
        }
    };

    return (
        <Container className="mt-4 dashboard-page">
            <h2 className="mb-4 dashboard-greeting">Dashboard</h2>
            {user ? (
                <>
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Card className="h-100 dashboard-card">
                                <Card.Body>
                                    <Card.Title className="d-flex justify-content-between align-items-center">
                                        Profile
                                        <Badge bg="primary">Active</Badge>
                                    </Card.Title>
                                    <p className="mb-2"><strong>Username:</strong> {user.username || 'Learner'}</p>
                                    <p className="mb-0"><strong>Email:</strong> {user.email}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="h-100 dashboard-card">
                                <Card.Body>
                                    <Card.Title>Learning Snapshot</Card.Title>
                                    <div className="d-flex align-items-baseline gap-2">
                                        <h3 className="mb-0">{wishlistCount}</h3>
                                        <span className="text-muted">Saved course(s)</span>
                                    </div>
                                    <small className="text-muted">Keep building your personalized learning path.</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="dashboard-card">
                        <Card.Body>
                            <Card.Title className="mb-3">Wishlisted Courses</Card.Title>
                            {wishlistCount > 0 ? (
                                <ListGroup variant="flush" className="dashboard-list">
                                    {wishlist.map((course) => (
                                        <ListGroup.Item key={course} className="d-flex justify-content-between align-items-center">
                                            <span>{course}</span>
                                            <Badge bg="info">Saved</Badge>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <Alert variant="secondary" className="mb-0">
                                    No courses wishlisted yet. Explore courses and save your favorites.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="dashboard-card mt-4 learning-path-section">
                        <Card.Body>
                            <Card.Title className="mb-3">Your AI Learning Path</Card.Title>
                            {recommendedPath.length > 0 ? (
                                <Row className="g-3">
                                    {recommendedPath.map((item, index) => (
                                        <Col md={6} key={`${item.id}-${index}`}>
                                            <Card className="h-100 border">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="mb-0">{item.title}</h6>
                                                        <Badge bg="primary">{getRankLabel(index)}</Badge>
                                                    </div>
                                                    <small className="text-muted d-block mb-3">{item.reason}</small>
                                                    <Button as={Link} to={`/course/${item.id}`} size="sm" variant="outline-primary">
                                                        Start Course
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <Alert variant="secondary" className="mb-0">
                                    Complete signup onboarding to generate your personalized AI learning path.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="dashboard-card mt-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Card.Title className="mb-0">Your Learning Roadmap</Card.Title>
                                <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    onClick={handleRegenerateRoadmap}
                                    disabled={roadmapLoading || recommendedPath.length === 0}
                                    title="Regenerate roadmap"
                                >
                                    <i className="bi bi-arrow-clockwise me-1"></i>
                                    Regenerate
                                </Button>
                            </div>

                            {recommendedPath.length === 0 && !roadmapLoading && (
                                <Alert variant="secondary" className="mb-0">
                                    Complete onboarding first to build your roadmap.
                                </Alert>
                            )}

                            {roadmapLoading && (
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <span className="small fw-semibold">Building your roadmap...</span>
                                    </div>
                                    <div className="roadmap-loading-bar mb-3">
                                        <span className="roadmap-loading-fill"></span>
                                    </div>
                                    <div className="d-flex gap-2" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                                        {[1, 2, 3].map((item) => (
                                            <Card key={item} className="dashboard-card" style={{ minWidth: '200px', flexShrink: 0 }}>
                                                <Card.Body>
                                                    <div className="skeleton-bg rounded mb-2" style={{ height: '12px', width: '90px' }}></div>
                                                    <div className="skeleton-bg rounded mb-2" style={{ height: '14px', width: '130px' }}></div>
                                                    <div className="skeleton-bg rounded mb-2" style={{ height: '10px', width: '160px' }}></div>
                                                    <div className="skeleton-bg rounded mb-2" style={{ height: '10px', width: '150px' }}></div>
                                                    <div className="d-flex gap-1 mt-2">
                                                        <div className="skeleton-bg rounded-pill" style={{ height: '20px', width: '60px' }}></div>
                                                        <div className="skeleton-bg rounded-pill" style={{ height: '20px', width: '52px' }}></div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!roadmapLoading && roadmap?.stages?.length > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        overflowX: 'auto',
                                        padding: '1rem 0'
                                    }}
                                >
                                    {roadmap.stages.map((stage, index) => (
                                        <React.Fragment key={`${stage.stageNumber}-${index}`}>
                                            <StageCard stage={stage} completedCourses={completedCourses} />
                                            {index < roadmap.stages.length - 1 && (
                                                <div
                                                    style={{
                                                        fontSize: '20px',
                                                        color: 'var(--text-muted)',
                                                        marginTop: '40px',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    →
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="dashboard-card mt-4 weak-topics-section">
                        <Card.Body>
                            <Card.Title className="mb-3">Topics to Review</Card.Title>
                            {weakTopicsByCourse.length > 0 ? (
                                <Row className="g-3">
                                    {weakTopicsByCourse.map((courseItem) => (
                                        <Col md={6} key={courseItem.id}>
                                            <Card className="h-100 border">
                                                <Card.Body>
                                                    <h6>{courseItem.name}</h6>
                                                    <ul className="mb-3 ps-3">
                                                        {courseItem.topics.map((topic, index) => (
                                                            <li key={`${courseItem.id}-${topic}-${index}`}>{topic}</li>
                                                        ))}
                                                    </ul>
                                                    <Button as={Link} to="/courses" size="sm" variant="outline-warning">
                                                        Retry Quiz
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <Alert variant="secondary" className="mb-0">
                                    No weak topics logged yet. Take quizzes to get smart revision recommendations.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                    <StudyHeatmap />
                </>
            ) : (
                <Alert variant="warning">Please login to view your dashboard.</Alert>
            )}
        </Container>
    );
}

export default Dashboard;
