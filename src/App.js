import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
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
    const navigate = useNavigate();

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

    const handleLogout = async () => {
        if (!window.confirm('Are you sure you want to logout?')) {
            return;
        }

        setUser(null);
        setAuthReady(true);
        await clearAuthenticatedUser();
        localStorage.removeItem('wishlist');
        setWishlist([]);
        navigate('/');
    };

    const handleWishlist = (course) => {
        if (!user) {
            if (window.confirm('You need to login to save courses. Go to login page?')) {
                navigate('/login');
            }
            return;
        }

        let updatedWishlist;
        if (wishlist.includes(course)) {
            updatedWishlist = wishlist.filter(item => item !== course);
        } else {
            updatedWishlist = [...wishlist, course];
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
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/courses"
                    element={
                        <PrivateRoute user={user} authReady={authReady}>
                            <Courses
                                onWishlist={handleWishlist}
                                wishlist={wishlist}
                                user={user}  // Pass user to Courses
                            />
                        </PrivateRoute>
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
