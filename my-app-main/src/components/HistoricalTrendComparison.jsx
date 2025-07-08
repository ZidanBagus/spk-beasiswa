import React from 'react';
import { Line } from 'react-chartjs-2';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { GraphUp } from 'react-bootstrap-icons';

const HistoricalTrendComparison = ({ isLoading }) => {
    // Mock historical comparison data
    const trendData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
        datasets: [
            {
                label: 'Periode Saat Ini (2024)',
                data: [45, 52, 48, 61, 55, 67],
                borderColor: 'rgb(13, 110, 253)',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4,
                borderWidth: 3
            },
            {
                label: 'Periode Sebelumnya (2023)',
                data: [38, 45, 42, 48, 44, 52],
                borderColor: 'rgb(108, 117, 125)',
                backgroundColor: 'rgba(108, 117, 125, 0.1)',
                tension: 0.4,
                borderWidth: 2,
                borderDash: [5, 5]
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Bulan'
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Jumlah Pendaftar'
                },
                beginAtZero: true
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    const currentTotal = 328;
    const previousTotal = 269;
    const growth = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1);

    if (isLoading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <GraphUp className="me-2" />
                        Analisis Tren Historis & Komparatif
                    </h6>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header>
                <h6 className="mb-0">
                    <GraphUp className="me-2" />
                    Analisis Tren Historis & Komparatif
                </h6>
                <small className="text-muted">Perbandingan pendaftaran periode saat ini vs sebelumnya</small>
            </Card.Header>
            <Card.Body>
                <div style={{ height: '250px' }} className="mb-3">
                    <Line data={trendData} options={options} />
                </div>
                
                <Row className="text-center">
                    <Col xs={4}>
                        <div className="border-end">
                            <div className="text-primary fw-bold h5">{currentTotal}</div>
                            <small className="text-muted">Periode Saat Ini</small>
                        </div>
                    </Col>
                    <Col xs={4}>
                        <div className="border-end">
                            <div className="text-secondary fw-bold h5">{previousTotal}</div>
                            <small className="text-muted">Periode Sebelumnya</small>
                        </div>
                    </Col>
                    <Col xs={4}>
                        <div>
                            <div className={`fw-bold h5 ${growth > 0 ? 'text-success' : 'text-danger'}`}>
                                {growth > 0 ? '+' : ''}{growth}%
                            </div>
                            <small className="text-muted">Pertumbuhan</small>
                        </div>
                    </Col>
                </Row>

                <div className="mt-3 p-2 bg-light rounded">
                    <small className="text-muted">
                        📈 <strong>Insight:</strong> Tren pendaftaran menunjukkan peningkatan {growth}% dibanding periode sebelumnya, 
                        dengan puncak tertinggi di bulan Juni.
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
};

export default HistoricalTrendComparison;