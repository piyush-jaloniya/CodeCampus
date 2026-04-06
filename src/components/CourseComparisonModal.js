import React from 'react';
import { Modal, Button, Table, Badge } from 'react-bootstrap';

function CourseComparisonModal({ show, onClose, coursesToCompare }) {
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
        <Modal show={show} onHide={onClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Course Comparison</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {coursesToCompare.length === 0 ? (
                    <p className="text-muted">No courses selected for comparison</p>
                ) : (
                    <>
                        <p className="text-muted mb-3">
                            Comparing <strong>{coursesToCompare.length}</strong> selected course(s)
                        </p>
                        <Table responsive hover bordered className="comparison-table align-middle">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '170px' }}>Attribute</th>
                                    {coursesToCompare.map((course) => (
                                        <th key={course.name}>{course.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="fw-semibold">Difficulty</td>
                                    {coursesToCompare.map((course) => (
                                        <td key={course.name}>
                                            <Badge bg={getDifficultyColor(course.difficulty)}>
                                                {course.difficulty}
                                            </Badge>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="fw-semibold">Duration</td>
                                    {coursesToCompare.map((course) => (
                                        <td key={course.name}>{course.duration}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="fw-semibold">Category</td>
                                    {coursesToCompare.map((course) => (
                                        <td key={course.name}>{course.category}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="fw-semibold">Rating</td>
                                    {coursesToCompare.map((course) => (
                                        <td key={course.name}>
                                            <small className="text-warning">
                                                {renderStars(course.rating)} {course.rating}
                                            </small>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="fw-semibold">Reviews</td>
                                    {coursesToCompare.map((course) => (
                                        <td key={course.name}>{course.reviews}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="fw-semibold">Students</td>
                                    {coursesToCompare.map((course) => (
                                        <td key={course.name}>{course.students || 'N/A'}</td>
                                    ))}
                                </tr>
                            </tbody>
                        </Table>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default CourseComparisonModal;
