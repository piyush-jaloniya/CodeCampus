import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
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
        <Container className="mt-4">
            <h2 className="text-center mb-4">Contact Us</h2>
            <div className="row">
                <div className="col-md-6 mb-4">
                    <Card className="contact-info">
                        <Card.Body>
                            <Card.Title>Get in Touch</Card.Title>
                            <Card.Text>
                                <p><i className="bi bi-envelope-fill me-2"></i> Email: {supportEmail}</p>
                                <p><i className="bi bi-telephone-fill me-2"></i> Phone: {supportPhone}</p>
                                <p><i className="bi bi-geo-alt-fill me-2"></i> Address: {supportAddress}</p>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-6">
                    <Card>
                        <Card.Body>
                            <Card.Title>Send us a Message</Card.Title>
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
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
}

export default Contact;