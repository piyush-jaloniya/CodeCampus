import React from 'react';
import { Container, ListGroup } from 'react-bootstrap';

function Dashboard({ user, wishlist }) {
    return (
        <Container className="mt-4">
            <h2>Dashboard</h2>
            {user ? (
                <>
                    <p><strong>Email:</strong> {user.email}</p>
                    <h4>Wishlisted Courses:</h4>
                    {wishlist.length > 0 ? (
                        <ListGroup>
                            {wishlist.map(course => (
                                <ListGroup.Item key={course}>{course}</ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <p>No courses wishlisted yet.</p>
                    )}
                </>
            ) : (
                <p>Please login to view your dashboard.</p>
            )}
        </Container>
    );
}

export default Dashboard;
