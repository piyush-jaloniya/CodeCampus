import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            const storedWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
            setWishlist(storedWishlist);
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
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

    return (
        <>
            <Navbar user={user} onLogout={handleLogout} />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/courses"
                    element={
                        <Courses
                            onWishlist={handleWishlist}
                            wishlist={wishlist}
                            user={user}  // Pass user to Courses
                        />
                    }
                />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                    path="/dashboard"
                    element={
                        <Dashboard
                            user={user}
                            wishlist={wishlist}
                        />
                    }
                />
            </Routes>
        </>
    );
}

export default App;