import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser } from '../utils/auth';

function Signup({ onSignup }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Sign Up – CodeCampus';
        return () => { document.title = 'CodeCampus'; };
    }, []);

    const getPasswordStrength = (password) => {
        if (!password) {
            return { score: 0, label: '', variant: 'secondary' };
        }

        let score = 0;
        if (password.length >= 8) score += 25;
        if (/[A-Z]/.test(password)) score += 25;
        if (/[0-9]/.test(password)) score += 25;
        if (/[^A-Za-z0-9]/.test(password)) score += 25;

        if (score <= 25) return { score, label: 'Weak', variant: 'danger' };
        if (score <= 50) return { score, label: 'Fair', variant: 'warning' };
        if (score <= 75) return { score, label: 'Good', variant: 'info' };
        return { score, label: 'Strong', variant: 'success' };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (submitError) {
            setSubmitError('');
        }
        // Clear error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            try {
                const authenticatedUser = await registerUser({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });

                if (onSignup) {
                    onSignup(authenticatedUser);
                }

                toast.success('Signup successful! Let us personalize your path.');
                navigate('/onboarding');
            } catch (error) {
                const message = error.message || 'Failed to save user data';
                setSubmitError(message);
                toast.error(message);
            }
        } else {
            toast.error('Please fix the errors in the form');
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card">
                <h2 className="auth-card-title">Create an account</h2>
                <p className="auth-card-subtitle">Join CodeCampus and start your learning journey</p>
                {submitError && <Alert variant="danger">{submitError}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formUsername" className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            type="text"
                            name="username"
                            placeholder="Enter username"
                            value={formData.username}
                            onChange={handleChange}
                            isInvalid={!!errors.username}
                            autoComplete="username"
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.username}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="formEmail" className="mb-3">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            placeholder="Enter email"
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
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            isInvalid={!!errors.password}
                            autoComplete="new-password"
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.password}
                        </Form.Control.Feedback>
                        {formData.password && (
                            <div className="mt-2">
                                <div className="d-flex justify-content-between">
                                    <small>Password strength</small>
                                    <small className={`text-${passwordStrength.variant}`}>{passwordStrength.label}</small>
                                </div>
                                <ProgressBar
                                    now={passwordStrength.score}
                                    variant={passwordStrength.variant}
                                    className="mt-1"
                                    style={{ height: '6px' }}
                                />
                            </div>
                        )}
                    </Form.Group>

                    <Form.Group controlId="formConfirmPassword" className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            isInvalid={!!errors.confirmPassword}
                            autoComplete="new-password"
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.confirmPassword}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Button variant="success" type="submit" className="w-100 mb-3">
                        Create Account
                    </Button>

                    <Row className="text-center">
                        <Col>
                            Already have an account? <Link to="/login">Login</Link>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    );
}

export default Signup;
