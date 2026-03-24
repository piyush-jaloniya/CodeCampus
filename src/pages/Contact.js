import React from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';

function Contact() {
    return (
        <Container className="mt-4">
            <h2 className="text-center mb-4">Contact Us</h2>
            <div className="row">
                <div className="col-md-6 mb-4">
                    <Card className="contact-info">
                        <Card.Body>
                            <Card.Title>Get in Touch</Card.Title>
                            <Card.Text>
                                <p><i className="bi bi-envelope-fill me-2"></i> Email: support@codecampus.com</p>
                                <p><i className="bi bi-telephone-fill me-2"></i> Phone: +1 234 567 8901</p>
                                <p><i className="bi bi-geo-alt-fill me-2"></i> Address: Chandigarh</p>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-6">
                    <Card>
                        <Card.Body>
                            <Card.Title>Send us a Message</Card.Title>
                            <Form>
                                <Form.Group className="mb-3" controlId="formName">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control type="text" placeholder="Enter your name" />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formEmail">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" placeholder="Enter your email" />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formMessage">
                                    <Form.Label>Message</Form.Label>
                                    <Form.Control as="textarea" rows={4} placeholder="Your message here" />
                                </Form.Group>
                                <Button variant="primary" type="submit">
                                    Send Message
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