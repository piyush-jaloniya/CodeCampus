import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const cooldownIntervalRef = useRef(null);

    const queueRequest = (targetEmail) => {
        let requests = [];
        try {
            requests = JSON.parse(localStorage.getItem('passwordResetRequests') || '[]');
        } catch {
            requests = [];
            localStorage.removeItem('passwordResetRequests');
        }
        requests.push({ email: targetEmail, requestedAt: new Date().toISOString() });
        localStorage.setItem('passwordResetRequests', JSON.stringify(requests));
    };

    const startCooldown = () => {
        if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
        }

        setResendCooldown(30);
        cooldownIntervalRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    if (cooldownIntervalRef.current) {
                        clearInterval(cooldownIntervalRef.current);
                        cooldownIntervalRef.current = null;
                    }
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
            }
        };
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        const validEmail = /^\S+@\S+\.\S+$/;
        if (!validEmail.test(email)) {
            setError('Enter a valid email address');
            return;
        }

        setError('');

        queueRequest(email);

        setSubmitted(true);
        startCooldown();
        toast.success('Reset link sent (demo mode). Check your email.');
    };

    const handleResend = () => {
        if (resendCooldown > 0) {
            return;
        }

        queueRequest(email);
        startCooldown();
        toast.info('Reset link resent. Please check your inbox.');
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card">
                <h2 className="auth-card-title">Forgot Password?</h2>
                <p className="auth-card-subtitle">Enter your email and we'll send you a reset link</p>
                {submitted ? (
                    <>
                        <Alert variant="success">
                            We have sent reset instructions to <strong>{email}</strong>.
                        </Alert>
                        <Button
                            variant="outline-primary"
                            className="w-100 mb-2"
                            onClick={handleResend}
                            disabled={resendCooldown > 0}
                        >
                            {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend email'}
                        </Button>
                    </>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="forgotPasswordEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Enter your account email"
                                isInvalid={Boolean(error)}
                            />
                            <Form.Control.Feedback type="invalid">
                                {error}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Button type="submit" className="w-100" variant="primary">
                            Send Reset Link
                        </Button>
                    </Form>
                )}
                <div className="text-center mt-3">
                    Back to <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
