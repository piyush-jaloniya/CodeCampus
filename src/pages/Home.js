import React, { useEffect, useState } from 'react';
import { Container, Button, Row, Col, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getTrendingCourses } from '../services/courseService';
import LoadingSkeleton from '../components/LoadingSkeleton';

function Home() {
    const [trendingCourses, setTrendingCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = 'CodeCampus – Learn. Build. Grow.';
        return () => { document.title = 'CodeCampus'; };
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
        <>
            <div
                className="hero-section text-white text-center py-5"
                style={{
                    backgroundImage: 'linear-gradient(rgba(61, 61, 61, 0.7), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <Container>
                    <h1 className="display-4 fw-bold mb-4">Welcome to CodeCampus</h1>
                    <p className="lead mb-4">Your hub for Computer Science courses and learning resources!</p>
                    <div className="d-flex flex-column flex-md-row gap-2 justify-content-center">
                        <Button as={Link} to="/login" variant="primary" size="lg" className="me-md-2 mb-2 mb-md-0">
                            Browse Courses
                        </Button>
                        <Button as={Link} to="/signup" variant="outline-light" size="lg">
                            Get Started
                        </Button>
                    </div>
                </Container>
            </div>

            <Container className="my-5">
                <h2 className="text-center mb-5">Why Choose CodeCampus?</h2>
                <Row className="g-4">
                    <Col md={4}>
                        <div className="home-feature-card p-4 rounded text-center h-100">
                            <img
                                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80"
                                alt="Coding"
                                className="img-fluid rounded mb-3"
                                style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                            />
                            <h3>Expert Courses</h3>
                            <p className="text-muted">Learn from industry professionals with real-world experience.</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="home-feature-card p-4 rounded text-center h-100">
                            <img
                                src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80"
                                alt="Hands-on Learning"
                                className="img-fluid rounded mb-3"
                                style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                            />
                            <h3>Hands-on Learning</h3>
                            <p className="text-muted">Practical exercises and projects to reinforce your knowledge.</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="home-feature-card p-4 rounded text-center h-100">
                            <img
                                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1522&q=80"
                                alt="Flexible Schedule"
                                className="img-fluid rounded mb-3"
                                style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                            />
                            <h3>Flexible Schedule</h3>
                            <p className="text-muted">Learn at your own pace, anytime, anywhere.</p>
                        </div>
                    </Col>
                </Row>
            </Container>

            <div className="home-cta-section py-5">
                <Container className="text-center">
                    <h2 className="mb-2">Ready to Start Learning?</h2>
                    <p className="text-muted mb-4">Join thousands of learners already on CodeCampus.</p>
                    <Button as={Link} to="/signup" variant="primary" size="lg">
                        Join Now for Free
                    </Button>
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
                                <Card className="h-100 shadow-sm border-0">
                                    <Card.Img variant="top" src={course.image} style={{ height: '200px', objectFit: 'cover' }} />
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title>{course.name}</Card.Title>
                                        <div className="mb-2">
                                            <small className="text-warning">
                                                {renderStars(course.rating)} <span className="fw-bold">{course.rating}</span>
                                                <span className="text-muted"> ({course.reviews} reviews)</span>
                                            </small>
                                        </div>
                                        <div className="mb-3">
                                            <Badge bg="info" className="me-2">{course.category}</Badge>
                                            <Badge bg={getDifficultyColor(course.difficulty)}>{course.difficulty}</Badge>
                                        </div>
                                        <p className="text-muted small flex-grow-1">Enroll now to get started with this trending course</p>
                                        <Button as={Link} to="/login" variant="primary" className="align-self-start">
                                            Learn More
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </>
    );
}

export default Home;
