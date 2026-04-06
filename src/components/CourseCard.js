import React from 'react';
import { Button, Card, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AISummaryButton from './AISummaryButton';

function CourseCard({ courseId, course, courseSlug, description, link, image, onWishlist, wishlist, user, category, difficulty, duration, rating, reviews, onCompare, isInCompare, onRate, onTestYourself }) {
    const navigate = useNavigate();
    const isWishlisted = wishlist.includes(course);

    const handleWishlist = () => {
        if (!user) {
            if (window.confirm('You need to login first. Go to login page?')) {
                navigate('/login');
            }
            return;
        }

        if (isWishlisted) {
            toast.info(`${course} removed from wishlist`);
        } else {
            toast.success(`${course} added to wishlist! ❤️`);
        }

        onWishlist(course);
    };

    const getDifficultyColor = (level) => {
        switch (level) {
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

    const handleRate = (value) => {
        if (!user) {
            if (window.confirm('You need to login first. Go to login page?')) {
                navigate('/login');
            }
            return;
        }

        onRate(value);
    };

    return (
        <Card style={{ width: '20rem' }} className="m-3 h-100">
            <Card.Img variant="top" src={image} style={{ height: '180px', objectFit: 'cover' }} />
            <Card.Body className="d-flex flex-column">
                <Card.Title>{course}</Card.Title>

                {/* Ratings */}
                {rating && (
                    <div className="mb-2">
                        <small className="text-warning">
                            {renderStars(rating)} <span className="text-dark fw-bold">{rating}</span>
                            <span className="text-muted"> ({reviews} reviews)</span>
                        </small>
                    </div>
                )}

                {/* Badges for Category and Difficulty */}
                <div className="mb-2">
                    {category && <Badge bg="info" className="me-2">{category}</Badge>}
                    {difficulty && <Badge bg={getDifficultyColor(difficulty)}>{difficulty}</Badge>}
                </div>

                <Card.Text className="flex-grow-1">{description}</Card.Text>

                {/* Duration Info */}
                {duration && (
                    <small className="text-muted mb-3">
                        <i className="bi bi-clock"></i> {duration}
                    </small>
                )}

                {onRate && (
                    <div className="mb-3">
                        <small className="text-muted d-block mb-1">Rate this course:</small>
                        <div className="d-flex gap-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <Button
                                    key={value}
                                    variant={value <= Math.round(rating) ? 'warning' : 'outline-warning'}
                                    size="sm"
                                    onClick={() => handleRate(value)}
                                    title={`Rate ${value} star${value > 1 ? 's' : ''}`}
                                >
                                    ★
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="d-flex justify-content-between gap-1 flex-wrap">
                    <Button as={Link} to={`/course/${courseId || courseSlug}`} variant="primary" className="flex-grow-1" size="sm">
                        Watch Course
                    </Button>
                    {onTestYourself && (
                        <Button variant="outline-dark" onClick={onTestYourself} size="sm" className="flex-grow-1">
                            Test Yourself
                        </Button>
                    )}
                    <Button
                        variant={isWishlisted ? "outline-danger" : "outline-success"}
                        onClick={handleWishlist}
                        disabled={!user}
                        title={!user ? "Login to save" : ""}
                        size="sm"
                    >
                        {isWishlisted ? '❤️' : '🤍'}
                    </Button>
                    {onCompare && (
                        <Button
                            variant={isInCompare ? "info" : "outline-info"}
                            onClick={onCompare}
                            title="Add to comparison"
                            size="sm"
                        >
                            ⚖️
                        </Button>
                    )}
                </div>

                <AISummaryButton
                    courseId={courseId || courseSlug || course}
                    courseName={course}
                    category={category || 'General'}
                />
                {!user && <small className="text-muted mt-2">Login to save</small>}
            </Card.Body>
        </Card>
    );
}

export default CourseCard;