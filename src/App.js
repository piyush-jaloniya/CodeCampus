import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import CoursePlayer from './pages/CoursePlayer';
import CoursePage from './pages/CoursePage';
import Flashcards from './pages/Flashcards';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import OnboardingQuiz from './components/OnboardingQuiz';
import ConfirmModal from './components/ConfirmModal';
import { clearAuthenticatedUser, getAuthenticatedUser } from './utils/auth';
import './App.css';

function PrivateRoute({ children, user, authReady }) {
    if (!authReady) {
        return null;
    }

    return user ? children : <Navigate to="/login" replace />;
}

function App() {
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [wishlist, setWishlist] = useState([]);
    const [accessibilityMode, setAccessibilityMode] = useState(() => localStorage.getItem('accessibilityMode') === 'true');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
    }, []);

    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            try {
                const storedUser = await getAuthenticatedUser();

                if (!isMounted) {
                    return;
                }

                if (storedUser) {
                    setUser(storedUser);
                    let storedWishlist = [];
                    try {
                        storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                    } catch {
                        storedWishlist = [];
                        localStorage.removeItem('wishlist');
                    }
                    setWishlist(Array.isArray(storedWishlist) ? storedWishlist : []);
                    setAuthReady(true);
                    return;
                }

                setUser(null);
                setWishlist([]);
            } catch {
                if (!isMounted) {
                    return;
                }

                setUser(null);
                setWishlist([]);
            } finally {
                if (isMounted) {
                    setAuthReady(true);
                }
            }
        };

        restoreSession();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle('accessible', accessibilityMode);
        localStorage.setItem('accessibilityMode', accessibilityMode ? 'true' : 'false');
    }, [accessibilityMode]);

    const handleLogin = (userData) => {
        setUser(userData);
        setAuthReady(true);
        navigate('/dashboard');
    };

    const handleSignup = (userData) => {
        setUser(userData);
        setAuthReady(true);
    };

    // Step 1: request logout (shows branded modal)
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    // Step 2: user confirmed logout
    const handleLogoutConfirmed = async () => {
        setShowLogoutModal(false);
        setUser(null);
        setAuthReady(true);
        await clearAuthenticatedUser();
        localStorage.removeItem('wishlist');
        setWishlist([]);
        navigate('/');
    };

    const handleWishlist = (course) => {
        if (!user) {
            toast.info('Create a free account to save courses to your wishlist.', {
                toastId: 'wishlist-auth-prompt'
            });
            return;
        }

        let updatedWishlist;
        if (wishlist.includes(course)) {
            updatedWishlist = wishlist.filter(item => item !== course);
            toast.success(`Removed "${course}" from your wishlist.`);
        } else {
            updatedWishlist = [...wishlist, course];
            toast.success(`Saved "${course}" to your wishlist!`);
        }
        setWishlist(updatedWishlist);
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    };

    const handleAccessibilityToggle = () => {
        setAccessibilityMode((previous) => !previous);
    };

    return (
        <>
            <Navbar
                user={user}
                onLogout={handleLogout}
                accessibilityMode={accessibilityMode}
                onToggleAccessibility={handleAccessibilityToggle}
            />
            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            {/* Branded logout confirmation modal replacing window.confirm() */}
            <ConfirmModal
                show={showLogoutModal}
                icon="👋"
                title="Sign out?"
                description={`You are signed in as ${user?.email || 'your account'}. You can sign back in at any time.`}
                confirmLabel="Sign Out"
                cancelLabel="Stay"
                confirmVariant="danger"
                onConfirm={handleLogoutConfirmed}
                onCancel={() => setShowLogoutModal(false)}
            />
            <Routes>
                <Route path="/" element={<Home user={user} authReady={authReady} />} />
                <Route
                    path="/courses"
                    element={
                        <Courses
                            onWishlist={handleWishlist}
                            wishlist={wishlist}
                            user={user}
                        />
                    }
                />
                <Route path="/contact" element={<Contact />} />
                <Route
                    path="/flashcards"
                    element={
                        <PrivateRoute user={user} authReady={authReady}>
                            <Flashcards />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/analytics"
                    element={
                        <PrivateRoute user={user} authReady={authReady}>
                            <Analytics />
                        </PrivateRoute>
                    }
                />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
                <Route
                    path="/onboarding"
                    element={
                        <PrivateRoute user={user} authReady={authReady}>
                            <OnboardingQuiz />
                        </PrivateRoute>
                    }
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                    path="/course/:courseId"
                    element={
                        <PrivateRoute user={user} authReady={authReady}>
                            <CoursePage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/learn/:courseSlug"
                    element={
                        <PrivateRoute user={user} authReady={authReady}>
                            <CoursePlayer />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute user={user} authReady={authReady}>
                            <Dashboard
                                user={user}
                                wishlist={wishlist}
                            />
                        </PrivateRoute>
                    }
                />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default App;
