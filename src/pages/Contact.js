import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

function Contact() {
    const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@codecampus.com';
    const supportPhone = process.env.REACT_APP_SUPPORT_PHONE || '+1 234 567 8901';
    const supportAddress = process.env.REACT_APP_SUPPORT_ADDRESS || 'Chandigarh';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        document.title = 'Contact Us – CodeCampus';
        return () => { document.title = 'CodeCampus'; };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
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
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
        if (!formData.message.trim()) newErrors.message = 'Message is required';
        else if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call with delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Store message in localStorage for demo
            let submissions = [];
            try {
                submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
            } catch {
                submissions = [];
                localStorage.removeItem('contactSubmissions');
            }
            const newSubmission = {
                id: Date.now(),
                ...formData,
                submittedAt: new Date().toISOString()
            };
            submissions.push(newSubmission);
            localStorage.setItem('contactSubmissions', JSON.stringify(submissions));

            toast.success('Message sent successfully! We will get back to you soon.');

            // Reset form
            setFormData({
                name: '',
                email: '',
                message: ''
            });
        } catch (error) {
            toast.error('Failed to send message. Please try again.');
            console.error('Contact form error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container className="mt-4 pb-5">
            <h2 className="text-center mb-2">Contact Us</h2>
            <p className="text-center text-muted mb-4">We'd love to hear from you</p>
            <Row className="g-4">
                <Col md={5}>
                    <Card className="contact-info h-100">
                        <Card.Body>
                            <Card.Title className="mb-4">Get in Touch</Card.Title>
                            <div className="d-flex align-items-center mb-3 gap-3">
                                <div className="contact-icon-wrap">
                                    <i className="bi bi-envelope-fill"></i>
                                </div>
                                <div>
                                    <div className="small text-muted">Email</div>
                                    <div>{supportEmail}</div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center mb-3 gap-3">
                                <div className="contact-icon-wrap">
                                    <i className="bi bi-telephone-fill"></i>
                                </div>
                                <div>
                                    <div className="small text-muted">Phone</div>
                                    <div>{supportPhone}</div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div className="contact-icon-wrap">
                                    <i className="bi bi-geo-alt-fill"></i>
                                </div>
                                <div>
                                    <div className="small text-muted">Address</div>
                                    <div>{supportAddress}</div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={7}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title className="mb-4">Send us a Message</Card.Title>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formName">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        isInvalid={!!errors.name}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formEmail">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        isInvalid={!!errors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formMessage">
                                    <Form.Label>Message</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="message"
                                        placeholder="Your message here (minimum 10 characters)"
                                        value={formData.message}
                                        onChange={handleChange}
                                        isInvalid={!!errors.message}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Contact;