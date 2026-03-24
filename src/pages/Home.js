import React from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <>
            {/* Hero Section with Background Image */}
            <div
                className="hero-section text-white text-center py-5"
                style={{
                    backgroundImage: 'linear-gradient(rgba(61, 61, 61, 0.7), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80)',

                    backgroundPosition: 'center',
                }}
            >
                <Container>
                    <h1 className="display-4 fw-bold mb-4">Welcome to CodeCampus</h1>
                    <p className="lead mb-4">Your hub for Computer Science courses and learning resources!</p>
                    <div className="d-flex flex-column flex-md-row gap-2 justify-content-center">
                        <Button as={Link} to="/courses" variant="primary" size="lg" className="me-md-2 mb-2 mb-md-0">
                            Browse Courses
                        </Button>
                        <Button as={Link} to="/signup" variant="outline-light" size="lg">
                            Get Started
                        </Button>
                    </div>
                </Container>
            </div>

            {/* Features Section with Images */}
            <Container className="my-5">
                <h2 className="text-center mb-5">Why Choose CodeCampus?</h2>
                <Row className="g-4">
                    <Col md={4}>
                        <div className="p-4 bg-white rounded shadow-sm text-center h-100">
                            <img
                                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80"
                                alt="Coding"
                                className="img-fluid rounded mb-3"
                                style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                            />
                            <h3>Expert Courses</h3>
                            <p>Learn from industry professionals with real-world experience.</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="p-4 bg-white rounded shadow-sm text-center h-100">
                            <img
                                src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80"
                                alt="Hands-on Learning"
                                className="img-fluid rounded mb-3"
                                style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                            />
                            <h3>Hands-on Learning</h3>
                            <p>Practical exercises and projects to reinforce your knowledge.</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="p-4 bg-white rounded shadow-sm text-center h-100">
                            <img
                                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1522&q=80"
                                alt="Flexible Schedule"
                                className="img-fluid rounded mb-3"
                                style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                            />
                            <h3>Flexible Schedule</h3>
                            <p>Learn at your own pace, anytime, anywhere.</p>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Call-to-Action Section */}
            <div className="bg-light py-5">
                <Container className="text-center">
                    <h2 className="mb-4">Ready to Start Learning?</h2>
                    <Button as={Link} to="/signup" variant="primary" size="lg">
                        Join Now for Free
                    </Button>
                </Container>
            </div>
        </>
    );
}

export default Home;