import React, { useEffect, useMemo, useState } from 'react';
import { Container, Button, Row, Col, Card, Badge } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { getTrendingCourses } from '../services/courseService';
import LoadingSkeleton from '../components/LoadingSkeleton';

function Home({ user, authReady = true }) {
    const [trendingCourses, setTrendingCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    const isLoggedIn = Boolean(user);
    const showGuestCtas = authReady && !isLoggedIn;

    const homePalette = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const queryPalette = params.get('palette');

        if (queryPalette === 'bw') {
            localStorage.setItem('homePalette', 'bw');
            return 'bw';
        }

        const storedPalette = localStorage.getItem('homePalette');
        return storedPalette === 'bw' ? 'bw' : 'forest';
    }, [location.search]);

    useEffect(() => {
        document.title = 'CodeCampus – Learn. Build. Grow.';

    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTrendingCourses(getTrendingCourses(3));
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner': return 'success';
            case 'Intermediate': return 'warning';
            case 'Advanced': return 'danger';
            default: return 'secondary';
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push('★');
            } else if (i === fullStars && hasHalf) {
                stars.push('⭐');
            } else {
                stars.push('☆');
            }
        }

        return stars.join('');
    };

    return (
        <div className={`home-page-theme ${homePalette === 'bw' ? 'home-page-bw' : 'home-page-forest'}`}>
            {/* Hero Section */}
            <div className="hero-section text-center">
                <Container className="hero-content-shell">
                    <p className="hero-kicker">
                        ✨ AI-Powered Learning
                    </p>
                    <h1 className="display-4 fw-bold mb-3 hero-title">
                        Master Computer Science,
                        <br />
                        <span className="hero-title-accent">at your own pace.</span>
                    </h1>
                    <p className="lead mb-5 hero-lead">
                        Curated CS courses, AI-generated study plans, and smart flashcards — all in one place.
                    </p>
                    <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                        {isLoggedIn ? (
                            // Logged-in CTAs
                            <>
                                <Button as={Link} to="/dashboard" variant="primary" size="lg">
                                    Go to Dashboard →
                                </Button>
                                <Button as={Link} to="/courses" variant="outline-secondary" size="lg">
                                    Browse Courses
                                </Button>
                            </>
                        ) : showGuestCtas ? (
                            // Guest CTAs
                            <>
                                <Button as={Link} to="/courses" variant="primary" size="lg">
                                    Browse Courses →
                                </Button>
                                <Button as={Link} to="/signup" variant="outline-secondary" size="lg">
                                    Create Free Account
                                </Button>
                            </>
                        ) : (
                            <Button as={Link} to="/courses" variant="primary" size="lg">
                                Browse Courses →
                            </Button>
                        )}
                    </div>

                    {/* Trust badges */}
                    <div className="hero-trust-badges">
                        <span className="trust-badge"><span>📚</span> 6 Curated Courses</span>
                        <span className="trust-badge"><span>🤖</span> AI Study Companion</span>
                        <span className="trust-badge"><span>🎓</span> Always Free</span>
                        <span className="trust-badge"><span>⚡</span> No Setup Required</span>
                    </div>
                </Container>
            </div>

            {/* Why CodeCampus — AI Feature Highlights */}
            <Container className="my-5 py-3">
                <h2 className="text-center mb-2 fw-bold section-title">Why CodeCampus?</h2>
                <p className="text-center mb-5 section-subtitle">Everything you need to learn smarter, not harder.</p>
                <Row className="g-4">
                    <Col md={4}>
                        <div className="home-feature-card p-4 rounded-4 text-center h-100">
                            <div className="home-feature-icon">🤖</div>
                            <h3 className="h5 fw-bold mb-2">AI Study Companion</h3>
                            <p className="home-feature-copy">Ask questions about any topic while watching lectures. Get instant explanations from Gemini AI.</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="home-feature-card p-4 rounded-4 text-center h-100">
                            <div className="home-feature-icon">🗺️</div>
                            <h3 className="h5 fw-bold mb-2">Personalized Roadmap</h3>
                            <p className="home-feature-copy">Take a 2-minute quiz and get an AI-curated learning path tailored to your goals and skill level.</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="home-feature-card p-4 rounded-4 text-center h-100">
                            <div className="home-feature-icon">🏗️</div>
                            <h3 className="h5 fw-bold mb-2">Smart Flashcards</h3>
                            <p className="home-feature-copy">Save any term from AI notes as a flashcard. Generate AI explanations on the back with one click.</p>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* CTA Banner */}
            <div className="home-cta-section py-5">
                <Container className="text-center">
                    {user ? (
                        <>
                            <h2 className="mb-2 fw-bold cta-title">Ready to continue learning?</h2>
                            <p className="cta-subtitle mb-4">Your roadmap, flashcards, and progress are waiting.</p>
                            <Button as={Link} to="/dashboard" variant="primary" size="lg">
                                Go to Dashboard →
                            </Button>
                        </>
                    ) : (
                        <>
                            <h2 className="mb-2 fw-bold cta-title">Build your personalized path in 2 minutes.</h2>
                            <p className="cta-subtitle mb-4">Take a quick quiz. Get a roadmap. Start learning today.</p>
                            <Button as={Link} to="/signup" variant="primary" size="lg">
                                Create Free Account →
                            </Button>
                        </>
                    )}
                </Container>
            </div>

            <Container className="my-5">
                <h2 className="text-center mb-5">Trending Courses</h2>
                {isLoading ? (
                    <LoadingSkeleton count={3} />
                ) : (
                    <Row className="g-4 justify-content-center">
                        {trendingCourses.map((course) => (
                            <Col key={course.name} md={4}>
                                <Card className="h-100 shadow-sm border-0 trending-card">
                                    <Card.Img variant="top" src={course.image} className="trending-image" />
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title>{course.name}</Card.Title>
                                        <div className="mb-2">
                                            <small className="trending-rating">
                                                {renderStars(course.rating)} <span className="fw-bold">{course.rating}</span>
                                                <span className="text-muted"> ({course.reviews} reviews)</span>
                                            </small>
                                        </div>
                                        <div className="mb-3">
                                            <Badge bg="info" className="me-2">{course.category}</Badge>
                                            <Badge bg={getDifficultyColor(course.difficulty)}>{course.difficulty}</Badge>
                                        </div>
                                        <p className="text-muted small flex-grow-1">Enroll now to get started with this trending course</p>
                                        <Button as={Link} to="/courses" variant="primary" className="align-self-start">
                                            Learn More
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </div>
    );
}

export default Home;
