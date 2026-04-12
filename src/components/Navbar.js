import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar as BootstrapNavbar, Image } from 'react-bootstrap';
import logo from './icon.ico';
import { startTour } from '../pages/Dashboard';
import { useTheme } from '../context/ThemeContext';

function Navbar({ user, onLogout, accessibilityMode, onToggleAccessibility }) {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const isLoggedIn = !!user;

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const primaryLinks = isLoggedIn
        ? [
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/courses', label: 'Courses' },
            { path: '/flashcards', label: 'Flashcards' },
            { path: '/analytics', label: 'Analytics' },
            { path: '/contact', label: 'Contact' }
        ]
        : [
            { path: '/', label: 'Home' },
            { path: '/contact', label: 'Contact' }
        ];

    return (
        <BootstrapNavbar variant="dark" expand="lg" className="app-navbar">
            <Container>
                <BootstrapNavbar.Brand as={Link} to={isLoggedIn ? '/dashboard' : '/'} className="d-flex align-items-center brand-lockup">
                    <Image
                        src={logo}
                        alt="CodeCampus Logo"
                        className="navbar-logo me-2"
                    />
                    <div className="d-flex flex-column">
                        <span className="brand-title">CodeCampus</span>
                        <small className="brand-subtitle">Learn. Build. Grow.</small>
                    </div>
                </BootstrapNavbar.Brand>
                <BootstrapNavbar.Toggle aria-controls="main-navbar-nav" />
                <BootstrapNavbar.Collapse id="main-navbar-nav">
                    <Nav className="me-auto nav-main-links">
                        {primaryLinks.map((link) => (
                            <Nav.Link
                                key={link.path}
                                className={`nav-pill ${isActive(link.path)} ${link.path === '/courses' ? 'nav-courses-link' : ''}`}
                                as={Link}
                                to={link.path}
                                aria-label={`Go to ${link.label}`}
                            >
                                {link.label}
                            </Nav.Link>
                        ))}
                    </Nav>
                    <Nav className="nav-action-links">
                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            style={{
                                background: 'var(--bg-hover)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
                        </button>
                        {isLoggedIn ? (
                            <>
                                <Nav.Link
                                    onClick={onToggleAccessibility}
                                    title="Toggle Accessibility Mode"
                                    className={`accessibility-toggle-link ${accessibilityMode ? 'active' : ''}`}
                                    aria-label="Toggle accessibility mode"
                                    aria-pressed={accessibilityMode}
                                    role="button"
                                >
                                    <i className={`bi ${accessibilityMode ? 'bi-eye-fill' : 'bi-eye'} me-2`}></i>
                                    {`Accessibility: ${accessibilityMode ? 'On' : 'Off'}`}
                                </Nav.Link>
                                <Nav.Link
                                    onClick={startTour}
                                    title="Help"
                                    className="help-toggle-link"
                                    aria-label="Start onboarding tour"
                                >
                                    <i className="bi bi-question-circle-fill me-2"></i>
                                    Help
                                </Nav.Link>
                                <span className="user-chip">Hi, {user.username || 'Learner'}</span>
                                <Nav.Link onClick={onLogout} className="logout-link" aria-label="Logout">
                                    Logout
                                </Nav.Link>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login" className="nav-pill" aria-label="Go to Login">
                                    Login
                                </Nav.Link>
                                <Nav.Link as={Link} to="/signup" className="signup-cta" aria-label="Go to Signup">
                                    Signup
                                </Nav.Link>
                            </>
                        )}
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>
    );
}

export default Navbar;
