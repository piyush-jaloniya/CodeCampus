import React from 'react';
import { Card, Placeholder, Row, Col } from 'react-bootstrap';

function LoadingSkeleton({ count = 3 }) {
    return (
        <Row xs={1} sm={2} lg={3} className="g-4 justify-content-center">
            {Array.from({ length: count }).map((_, index) => (
                <Col key={index}>
                    <Card className="m-3 h-100">
                        <div className="skeleton-bg skeleton-thumb" />
                        <Card.Body>
                            <Placeholder as={Card.Title} animation="glow">
                                <Placeholder xs={8} />
                            </Placeholder>
                            <Placeholder as={Card.Text} animation="glow">
                                <Placeholder xs={7} />
                                <Placeholder xs={6} />
                                <Placeholder xs={4} />
                            </Placeholder>
                            <div className="d-flex gap-2 mt-3">
                                <Placeholder.Button variant="primary" xs={6} />
                                <Placeholder.Button variant="secondary" xs={4} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}

export default LoadingSkeleton;
