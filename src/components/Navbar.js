import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar as BootstrapNavbar, Image } from 'react-bootstrap';
import logo from './icon.ico';
import { startTour } from '../pages/Dashboard';

function Navbar({ user, onLogout, accessibilityMode, onToggleAccessibility }) {
    const location = useLocation();
    const isLoggedIn = !!user;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Primary nav links in the top navbar
    const primaryLinks = [
        { path: '/', label: 'Home' },
        { path: '/courses', label: 'Courses' },
        ...(isLoggedIn
            ? [
                { path: '/dashboard', label: 'Dashboard' },
                { path: '/flashcards', label: 'Flashcards' },
                { path: '/analytics', label: 'Analytics' },
            ]
            : []),
    ];

    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : 'Me';

    const homePalette = useMemo(() => {
        if (location.pathname !== '/') {
            return null;
        }

        const params = new URLSearchParams(location.search);
        const queryPalette = params.get('palette');

        if (queryPalette === 'bw') {
            return 'bw';
        }

        const storedPalette = localStorage.getItem('homePalette');
        return storedPalette === 'bw' ? 'bw' : 'forest';
    }, [location.pathname, location.search]);

    const navbarPaletteClass = homePalette ? `home-nav-${homePalette}` : '';

    return (
        <BootstrapNavbar variant="dark" expand="lg" className={`app-navbar ${navbarPaletteClass}`}>
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
                    {/* Primary navigation links */}
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

                    {/* Right-side controls */}
                    <Nav className="nav-action-links">
                        {isLoggedIn ? (
                            /* Avatar dropdown for authenticated users */
                            <div className="nav-avatar-wrap" ref={dropdownRef}>
                                <button
                                    type="button"
                                    className="nav-avatar-btn"
                                    onClick={() => setDropdownOpen((prev) => !prev)}
                                    aria-expanded={dropdownOpen}
                                    aria-haspopup="true"
                                    aria-label="Open account menu"
                                >
                                    <div className="nav-avatar-circle" aria-hidden="true">{initials}</div>
                                    <span className="nav-avatar-name">{user.username || 'Learner'}</span>
                                    <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} nav-avatar-chevron`} />
                                </button>

                                {dropdownOpen && (
                                    <div className="nav-dropdown" role="menu">
                                        {/* Account info header */}
                                        <div className="nav-dropdown-header">
                                            <div className="nav-account-label">Signed in as</div>
                                            <div className="nav-account-email">{user.email}</div>
                                        </div>

                                        <div className="nav-dropdown-divider" />

                                        <button
                                            className="nav-dropdown-item"
                                            role="menuitem"
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                onToggleAccessibility();
                                            }}
                                        >
                                            <i className={`bi ${accessibilityMode ? 'bi-eye-fill' : 'bi-eye'}`} />
                                            Accessibility {accessibilityMode ? 'On' : 'Off'}
                                        </button>

                                        <button
                                            className="nav-dropdown-item"
                                            role="menuitem"
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                startTour();
                                            }}
                                        >
                                            <i className="bi bi-question-circle" />
                                            Help &amp; Tour
                                        </button>

                                        <div className="nav-dropdown-divider" />

                                        <button
                                            className="nav-dropdown-item danger"
                                            role="menuitem"
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                onLogout();
                                            }}
                                            aria-label="Sign out"
                                        >
                                            <i className="bi bi-box-arrow-right" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Guest auth links */
                            <>
                                <Nav.Link as={Link} to="/login" className="nav-pill" aria-label="Go to Login">
                                    Login
                                </Nav.Link>
                                <Nav.Link as={Link} to="/signup" className="signup-cta" aria-label="Get started for free">
                                    Get Started
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
