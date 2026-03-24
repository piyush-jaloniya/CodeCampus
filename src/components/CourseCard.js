import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function CourseCard({ course, description, link, image, onWishlist, wishlist, user }) {
    const navigate = useNavigate();
    const isWishlisted = wishlist.includes(course);

    const handleWishlist = () => {
        if (!user) {
            if (window.confirm('You need to login first. Go to login page?')) {
                navigate('/login');
            }
            return;
        }
        onWishlist(course);
    };

    return (
        <Card style={{ width: '20rem' }} className="m-3">
            <Card.Img variant="top" src={image} style={{ height: '180px', objectFit: 'cover' }} />
            <Card.Body>
                <Card.Title>{course}</Card.Title>
                <Card.Text>{description}</Card.Text>
                <div className="d-flex justify-content-between">
                    <Button variant="primary" href={link} target="_blank">
                        View Course
                    </Button>
                    <Button
                        variant={isWishlisted ? "outline-danger" : "outline-success"}
                        onClick={handleWishlist}
                        disabled={!user}
                    >
                        {isWishlisted ? 'Saved' : 'Save'}
                    </Button>
                </div>
                {!user && <small className="text-muted">Login to save</small>}
            </Card.Body>
        </Card>
    );
}

export default CourseCard;