import React, { useEffect } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { getCourseBySlug } from '../services/courseService';
import AIChatWidget from '../components/AIChatWidget';
import { logStudyActivity } from '../utils/studyActivity';

function CoursePlayer() {
    const { courseSlug } = useParams();
    const course = getCourseBySlug(courseSlug || '');

    useEffect(() => {
        if (courseSlug) {
            logStudyActivity();
        }
    }, [courseSlug]);

    if (!course) {
        return (
            <Container className="mt-4">
                <Alert variant="warning">
                    Course not found. Please return to the courses page.
                </Alert>
                <Button as={Link} to="/courses" variant="primary">
                    Back to Courses
                </Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row className="g-4">
                <Col lg={8}>
                    <div className="video-embed-shell">
                        {course.embedUrl ? (
                            <iframe
                                title={course.name}
                                src={course.embedUrl}
                                className="video-embed-frame no-transition"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <Alert variant="info" className="m-0">
                                Embedded playback is unavailable for this link.
                            </Alert>
                        )}
                    </div>
                </Col>
                <Col lg={4}>
                    <Card className="h-100">
                        <Card.Img variant="top" src={course.image} className="course-player-image" />
                        <Card.Body className="d-flex flex-column">
                            <Card.Title>{course.name}</Card.Title>
                            <div className="mb-2">
                                <Badge bg="info" className="me-2">{course.category}</Badge>
                                <Badge bg="secondary">{course.difficulty}</Badge>
                            </div>
                            <Card.Text className="flex-grow-1">{course.description}</Card.Text>
                            <div className="d-flex gap-2">
                                <Button as={Link} to="/courses" variant="outline-primary" className="flex-grow-1">
                                    Back
                                </Button>
                                <Button href={course.link} target="_blank" rel="noreferrer" variant="primary" className="flex-grow-1">
                                    Open YouTube
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <AIChatWidget courseName={course.name} />
        </Container>
    );
}

export default CoursePlayer;
