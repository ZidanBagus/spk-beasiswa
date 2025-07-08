import React, { useState } from 'react';
import { Card, Form, Row, Col, Badge, Button } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';

const InteractiveFilter = ({ onFilterChange, stats }) => {
    const [activeFilters, setActiveFilters] = useState({});

    const filterOptions = {
        ipk: ['< 3.0', '3.0 - 3.25', '3.25 - 3.5', '3.5 - 3.75', '> 3.75'],
        penghasilan: ['Rendah', 'Sedang', 'Tinggi'],
        tanggungan: ['1-2', '3-4', '5+'],
        organisasi: ['Ya', 'Tidak'],
        ukm: ['Ya', 'Tidak']
    };

    const handleFilterChange = (category, value) => {
        const newFilters = { ...activeFilters };
        if (newFilters[category] === value) {
            delete newFilters[category];
        } else {
            newFilters[category] = value;
        }
        setActiveFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearAllFilters = () => {
        setActiveFilters({});
        onFilterChange({});
    };

    return (
        <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">🔍 Filter Interaktif - Analisis Multivariat</h6>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    {Object.entries(filterOptions).map(([category, options]) => (
                        <Col md={2} key={category}>
                            <Form.Label className="fw-semibold text-capitalize">{category}</Form.Label>
                            <div className="d-flex flex-wrap gap-1">
                                {options.map(option => (
                                    <Badge
                                        key={option}
                                        bg={activeFilters[category] === option ? 'primary' : 'light'}
                                        text={activeFilters[category] === option ? 'white' : 'dark'}
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleFilterChange(category, option)}
                                        style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        {option}
                                    </Badge>
                                ))}
                            </div>
                        </Col>
                    ))}
                    <Col md={2} className="d-flex align-items-end">
                        <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            onClick={clearAllFilters}
                            disabled={Object.keys(activeFilters).length === 0}
                        >
                            <X /> Clear All
                        </Button>
                    </Col>
                </Row>
                
                {Object.keys(activeFilters).length > 0 && (
                    <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted">Filter Aktif: </small>
                        {Object.entries(activeFilters).map(([key, value]) => (
                            <Badge key={key} bg="primary" className="me-1">
                                {key}: {value}
                            </Badge>
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default InteractiveFilter;