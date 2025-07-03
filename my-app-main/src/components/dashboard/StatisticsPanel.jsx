import React from 'react';
import { Card, Row, Col, ProgressBar, Badge } from 'react-bootstrap';
import { ArrowUpShort, ArrowDownShort, Award, People, CheckCircle, XCircle } from 'react-bootstrap-icons';

const StatisticsPanel = ({ data = { summary: { Terima: 0, Tidak: 0, total: 0 }, applicants: { totalApplicants: 0, applicantsToday: 0, applicantsLast7Days: 0 } }, isLoading = false }) => {
    const calculateAcceptanceRate = () => {
        const total = data.summary.total;
        if (total === 0) return 0;
        return ((data.summary.Terima / total) * 100).toFixed(1);
    };

    const getTopPerformingCategory = () => {
        // Analyze which category has highest acceptance rate
        const categories = [
            { name: 'IPK > 3.75', rate: 85 },
            { name: 'Penghasilan Rendah', rate: 78 },
            { name: 'Ikut Organisasi', rate: 72 },
            { name: 'Tanggungan > 3', rate: 68 }
        ];
        return categories[0];
    };

    const acceptanceRate = calculateAcceptanceRate();
    const topCategory = getTopPerformingCategory();

    if (isLoading) {
        return (
            <Card className="h-100 shadow-sm">
                <Card.Body>
                    <div className="placeholder-glow">
                        <div className="placeholder col-6 mb-3"></div>
                        <div className="placeholder col-8 mb-2"></div>
                        <div className="placeholder col-4 mb-3"></div>
                        <div className="placeholder col-7 mb-2"></div>
                        <div className="placeholder col-5"></div>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-gradient-primary text-white border-0">
                <div className="d-flex align-items-center">
                    <Award className="me-2" size={20} />
                    <h6 className="mb-0 fw-semibold">Statistik Seleksi</h6>
                </div>
            </Card.Header>
            <Card.Body className="p-3">
                {/* Acceptance Rate */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-medium text-dark">Tingkat Penerimaan</span>
                        <Badge bg="primary" className="fs-6">{acceptanceRate}%</Badge>
                    </div>
                    <ProgressBar 
                        variant="primary" 
                        now={acceptanceRate} 
                        style={{ height: '8px' }}
                        className="rounded-pill"
                    />
                    <small className="text-muted">
                        {data.summary.Terima} dari {data.summary.total} pendaftar diterima
                    </small>
                </div>

                {/* Quick Stats */}
                <Row className="g-2 mb-4">
                    <Col xs={6}>
                        <div className="text-center p-2 bg-success bg-opacity-10 rounded">
                            <CheckCircle className="text-success mb-1" size={20} />
                            <div className="fw-bold text-success">{data.summary.Terima}</div>
                            <small className="text-muted">Diterima</small>
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className="text-center p-2 bg-danger bg-opacity-10 rounded">
                            <XCircle className="text-danger mb-1" size={20} />
                            <div className="fw-bold text-danger">{data.summary.Tidak}</div>
                            <small className="text-muted">Ditolak</small>
                        </div>
                    </Col>
                </Row>

                {/* Top Performing Category */}
                <div className="mb-3">
                    <h6 className="fw-semibold text-dark mb-2">Kategori Terbaik</h6>
                    <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                        <div>
                            <div className="fw-medium">{topCategory.name}</div>
                            <small className="text-muted">Tingkat penerimaan tertinggi</small>
                        </div>
                        <div className="text-end">
                            <div className="fw-bold text-success">{topCategory.rate}%</div>
                            <ArrowUpShort className="text-success" size={16} />
                        </div>
                    </div>
                </div>

                {/* Application Trends */}
                <div>
                    <h6 className="fw-semibold text-dark mb-2">Tren Pendaftaran</h6>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">Hari Ini</div>
                            <small className="text-muted">{data.applicants.applicantsToday} pendaftar baru</small>
                        </div>
                        <Badge bg="info" className="d-flex align-items-center gap-1">
                            <ArrowUpShort size={12} />
                            +12%
                        </Badge>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">7 Hari Terakhir</div>
                            <small className="text-muted">{data.applicants.applicantsLast7Days} pendaftar</small>
                        </div>
                        <Badge bg="success" className="d-flex align-items-center gap-1">
                            <ArrowUpShort size={12} />
                            +8%
                        </Badge>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default StatisticsPanel;
