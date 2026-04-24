import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../utils/auth';

function Login({ onLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        document.title = 'Login – CodeCampus';

    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (loginError) {
            setLoginError('');
        }
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            try {
                const authenticatedUser = await loginUser({
                    email: formData.email,
                    password: formData.password
                });

                onLogin(authenticatedUser);
                toast.success(`Welcome back, ${authenticatedUser.username}!`);
            } catch (error) {
                const message = error.message || 'Invalid email or password';
                setLoginError(message);
                toast.error(message);
            }
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-split">
                {/* Brand panel */}
                <div className="auth-brand-panel">
                    <div className="auth-brand-logo">CodeCampus</div>
                    <div className="auth-brand-tagline">Learn · Build · Grow</div>
                    <ul className="auth-brand-features">
                        <li><span>🤖</span><span>AI Study Companion for every course</span></li>
                        <li><span>🗺️</span><span>Personalized learning roadmap</span></li>
                        <li><span>🏗️</span><span>Smart flashcards from your notes</span></li>
                        <li><span>📊</span><span>Progress analytics &amp; insights</span></li>
                    </ul>
                </div>

                {/* Form panel */}
                <div className="auth-form-panel">
                    <h2 className="auth-card-title">Welcome back</h2>
                    <p className="auth-card-subtitle">Sign in to continue learning</p>
                    {loginError && <div className="alert alert-danger py-2">{loginError}</div>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formEmail" className="mb-3">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                isInvalid={!!errors.email}
                                autoComplete="email"
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.email}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group controlId="formPassword" className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                placeholder="Your password"
                                value={formData.password}
                                onChange={handleChange}
                                isInvalid={!!errors.password}
                                autoComplete="current-password"
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.password}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 mb-3">
                            Sign In
                        </Button>

                        <div className="text-center mb-3">
                            <Link to="/forgot-password" className="auth-link-muted">Forgot password?</Link>
                        </div>

                        <div className="text-center auth-link-muted">
                            Don’t have an account? <Link to="/signup" className="auth-link-accent">Create one free</Link>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}

export default Login;
