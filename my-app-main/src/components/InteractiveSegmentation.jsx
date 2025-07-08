import React, { useState } from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { Funnel, X } from 'react-bootstrap-icons';

const InteractiveSegmentation = ({ onFilterChange, stats }) => {
    const [activeSegment, setActiveSegment] = useState(null);

    const segments = [
        { id: 'accepted', label: 'Diterima', count: stats?.summary?.Terima || 0, color: 'success' },
        { id: 'rejected', label: 'Ditolak', count: stats?.summary?.Tidak || 0, color: 'danger' },
        { id: 'high-ipk', label: 'IPK > 3.5', count: 85, color: 'warning' },
        { id: 'low-income', label: 'Penghasilan Rendah', count: 120, color: 'info' },
        { id: 'active-org', label: 'Aktif Organisasi', count: 95, color: 'primary' }
    ];

    const handleSegmentClick = (segment) => {
        if (activeSegment?.id === segment.id) {
            setActiveSegment(null);
            onFilterChange?.(null);
        } else {
            setActiveSegment(segment);
            onFilterChange?.(segment);
        }
    };

    const clearFilter = () => {
        setActiveSegment(null);
        onFilterChange?.(null);
    };

    return (
        <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                        <Funnel className="me-2" />
                        Segmentasi Interaktif & Cross-Filtering
                    </h6>
                    {activeSegment && (
                        <Button variant="light" size="sm" onClick={clearFilter}>
                            <X className="me-1" />
                            Clear Filter
                        </Button>
                    )}
                </div>
            </Card.Header>
            <Card.Body>
                <Row className="g-2 mb-3">
                    {segments.map(segment => (
                        <Col key={segment.id} md={2} sm={4} xs={6}>
                            <div 
                                className={`p-3 text-center rounded cursor-pointer transition-all ${
                                    activeSegment?.id === segment.id 
                                        ? `bg-${segment.color} text-white shadow-lg` 
                                        : `bg-${segment.color} bg-opacity-10 hover-shadow`
                                }`}
                                onClick={() => handleSegmentClick(segment)}
                                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                            >
                                <div className="fw-bold">{segment.count}</div>
                                <small>{segment.label}</small>
                            </div>
                        </Col>
                    ))}
                </Row>
                
                {activeSegment && (
                    <div className="alert alert-info mb-0">
                        <div className="d-flex align-items-center">
                            <Badge bg={activeSegment.color} className="me-2">
                                {activeSegment.label}
                            </Badge>
                            <span className="small">
                                Filter aktif: Menampilkan data untuk segmen "{activeSegment.label}" ({activeSegment.count} data)
                            </span>
                        </div>
                    </div>
                )}
                
                <div className="mt-3 p-2 bg-light rounded">
                    <small className="text-muted">
                        💡 <strong>Cara Penggunaan:</strong> Klik pada segmen untuk memfilter semua grafik di dashboard. 
                        Grafik akan menampilkan data hanya untuk segmen yang dipilih.
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
};

export default InteractiveSegmentation;