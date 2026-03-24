import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Nav, Navbar as BootstrapNavbar, Image } from 'react-bootstrap';
import logo from './icon.ico';

function Navbar({ user, onLogout }) {
    return (
        <BootstrapNavbar bg="dark" variant="dark" expand="lg">
            <Container>
                <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
                    <Image
                        src={logo}
                        alt="CodeCampus Logo"
                        className="navbar-logo me-2"
                    />
                    <span>CodeCampus</span>
                </BootstrapNavbar.Brand>
                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link className="me-auto" as={Link} to="/">Home</Nav.Link>
                        <Nav.Link className="me-auto" as={Link} to="/courses">Courses</Nav.Link>
                        <Nav.Link className="me-auto" as={Link} to="/contact">Contact</Nav.Link>
                    </Nav>
                    <Nav>
                        {user ? (
                            <>
                                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                                <Nav.Link onClick={onLogout}>Logout</Nav.Link>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Nav.Link as={Link} to="/signup">Signup</Nav.Link>
                            </>
                        )}
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>
    );
}

export default Navbar;
