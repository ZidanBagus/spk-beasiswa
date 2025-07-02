import React from 'react';
import { Card, Placeholder } from 'react-bootstrap';

const SummaryCard = ({ title, value, icon, variant = 'light', isLoading, className = '' }) => (
    <Card bg={variant} text={variant === 'light' ? 'dark' : 'white'} className={`shadow-sm h-100 border-0 ${className}`}>
        <Card.Body className="d-flex align-items-center p-3">
            <div className={`fs-2 me-4 text-${variant === 'light' ? 'primary' : 'white'} opacity-75`}>{icon}</div>
            <div>
                <Card.Subtitle className="mb-1 text-uppercase small fw-bold text-muted">{title}</Card.Subtitle>
                {isLoading ? (
                    <Placeholder as={Card.Title} animation="glow" className="mb-0">
                        <Placeholder xs={8} size="lg" />
                    </Placeholder>
                ) : (
                    <Card.Title as="h3" className="fw-bolder mb-0">{String(value)}</Card.Title>
                )}
            </div>
        </Card.Body>
    </Card>
);

export default SummaryCard;
