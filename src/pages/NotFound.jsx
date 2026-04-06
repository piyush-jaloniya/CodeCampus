import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NotFound() {
    return (
        <Container
            className="d-flex flex-column justify-content-center align-items-center text-center"
            style={{ minHeight: 'calc(100vh - 120px)', color: 'var(--text-primary)' }}
        >
            <h1 style={{ fontSize: '5rem', fontWeight: 800, marginBottom: '0.5rem' }}>404</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Oops! This page does not exist.
            </p>
            <Button as={Link} to="/" variant="primary">
                Go to Home
            </Button>
        </Container>
    );
}

export default NotFound;
