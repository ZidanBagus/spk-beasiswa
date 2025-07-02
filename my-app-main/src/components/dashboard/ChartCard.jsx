import React from 'react';
import { Card, Spinner } from 'react-bootstrap';

const ChartCard = ({ title, icon, children, isLoading }) => (
    <Card className="shadow-sm h-100 border-0">
        <Card.Header as="h6" className="fw-semibold bg-light-subtle border-bottom-0 pt-3 pb-2 px-3 d-flex align-items-center">
            {icon} <span className="ms-2">{title}</span>
        </Card.Header>
        <Card.Body style={{ height: '300px' }} className="p-2">
            {isLoading ? (
                <div className="d-flex h-100 justify-content-center align-items-center">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : children}
        </Card.Body>
    </Card>
);

export default ChartCard;
