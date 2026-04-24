import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NotFound() {
    return (
        <Container
            className="d-flex flex-column justify-content-center align-items-center text-center notfound-page"
        >
            <h1 className="notfound-code">404</h1>
            <p className="notfound-copy">
                Oops! This page does not exist.
            </p>
            <Button as={Link} to="/" variant="primary">
                Go to Home
            </Button>
        </Container>
    );
}

export default NotFound;
