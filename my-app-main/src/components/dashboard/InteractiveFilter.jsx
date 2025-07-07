import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge, ButtonGroup } from 'react-bootstrap';
import { Filter, X, TrophyFill, CashStack, People, Diagram3Fill, Activity } from 'react-bootstrap-icons';

const InteractiveFilter = ({ onFilterChange, activeFilters, stats }) => {
    const [selectedFilters, setSelectedFilters] = useState({});

    const filterOptions = {
        ipk: {
            icon: <TrophyFill className="text-warning" size={16} />,
            label: 'IPK',
            options: [
                { value: 'high', label: '≥ 3.5', color: 'success' },
                { value: 'medium', label: '3.0-3.49', color: 'warning' },
                { value: 'low', label: '< 3.0', color: 'danger' }
            ]
        },
        penghasilan: {
            icon: <CashStack className="text-success" size={16} />,
            label: 'Penghasilan',
            options: [
                { value: 'Rendah', label: 'Rendah', color: 'success' },
                { value: 'Sedang', label: 'Sedang', color: 'warning' },
                { value: 'Tinggi', label: 'Tinggi', color: 'danger' }
            ]
        },
        tanggungan: {
            icon: <People className="text-info" size={16} />,
            label: 'Tanggungan',
            options: [
                { value: 'high', label: '≥ 4 orang', color: 'info' },
                { value: 'medium', label: '2-3 orang', color: 'secondary' },
                { value: 'low', label: '1 orang', color: 'light' }
            ]
        },
        organisasi: {
            icon: <Diagram3Fill className="text-primary" size={16} />,
            label: 'Organisasi',
            options: [
                { value: 'Ya', label: 'Aktif', color: 'primary' },
                { value: 'Tidak', label: 'Tidak Aktif', color: 'secondary' }
            ]
        },
        ukm: {
            icon: <Activity className="text-danger" size={16} />,
            label: 'UKM',
            options: [
                { value: 'Ya', label: 'Aktif', color: 'danger' },
                { value: 'Tidak', label: 'Tidak Aktif', color: 'secondary' }
            ]
        }
    };

    const handleFilterSelect = (category, value) => {
        const newFilters = { ...selectedFilters };
        if (newFilters[category] === value) {
            delete newFilters[category];
        } else {
            newFilters[category] = value;
        }
        setSelectedFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearAllFilters = () => {
        setSelectedFilters({});
        onFilterChange({});
    };

    const getFilterCount = () => Object.keys(selectedFilters).length;

    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-gradient-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <Filter className="me-2" size={20} />
                        <h6 className="mb-0 fw-bold">Filter Interaktif - Analisis Korelasi</h6>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {getFilterCount() > 0 && (
                            <Badge bg="light" text="dark" className="px-2 py-1">
                                {getFilterCount()} filter aktif
                            </Badge>
                        )}
                        {getFilterCount() > 0 && (
                            <Button 
                                variant="outline-light" 
                                size="sm" 
                                onClick={clearAllFilters}
                            >
                                <X size={14} className="me-1" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </Card.Header>
            <Card.Body className="p-4">
                <p className="text-muted mb-3 small">
                    Klik kategori di bawah untuk memfilter semua grafik dan melihat korelasi antar atribut secara real-time
                </p>
                
                {Object.entries(filterOptions).map(([category, config]) => (
                    <Row key={category} className="mb-3 align-items-center">
                        <Col md={2} className="d-flex align-items-center">
                            {config.icon}
                            <span className="ms-2 fw-medium">{config.label}</span>
                        </Col>
                        <Col md={10}>
                            <ButtonGroup size="sm">
                                {config.options.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={selectedFilters[category] === option.value ? option.color : 'outline-secondary'}
                                        onClick={() => handleFilterSelect(category, option.value)}
                                        className="px-3"
                                    >
                                        {option.label}
                                        {selectedFilters[category] === option.value && (
                                            <Badge bg="light" text="dark" className="ms-2">
                                                ✓
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                            </ButtonGroup>
                        </Col>
                    </Row>
                ))}
                
                {getFilterCount() > 0 && (
                    <div className="mt-4 p-3 bg-light rounded">
                        <h6 className="fw-bold mb-2">Filter Aktif:</h6>
                        <div className="d-flex flex-wrap gap-2">
                            {Object.entries(selectedFilters).map(([category, value]) => {
                                const config = filterOptions[category];
                                const option = config.options.find(opt => opt.value === value);
                                return (
                                    <Badge 
                                        key={`${category}-${value}`}
                                        bg={option.color} 
                                        className="px-3 py-2 d-flex align-items-center"
                                    >
                                        {config.icon}
                                        <span className="ms-2">{config.label}: {option.label}</span>
                                        <X 
                                            size={12} 
                                            className="ms-2 cursor-pointer" 
                                            onClick={() => handleFilterSelect(category, value)}
                                        />
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default InteractiveFilter;