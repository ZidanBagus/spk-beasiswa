import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { BarChart, TrendingUp, Users, Award } from 'react-bootstrap-icons';
import reportService from '../services/reportService';

const QuickInsights = ({ isLoading }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const response = await reportService.getAllSelectionResults({ limit: 99999 });
            const results = response.results || [];
            
            const analysis = analyzeData(results);
            setInsights(analysis);
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeData = (data) => {
        const total = data.length;
        const accepted = data.filter(item => (item.statusKelulusan || '').trim() === 'Terima').length;
        const acceptanceRate = total > 0 ? (accepted / total * 100) : 0;
        
        const highIPK = data.filter(item => parseFloat(item.ipk) >= 3.5).length;
        const lowIncome = data.filter(item => item.penghasilanOrtu === 'Rendah').length;
        const activeOrg = data.filter(item => item.ikutOrganisasi === 'Ya').length;
        const activeUKM = data.filter(item => item.ikutUKM === 'Ya').length;

        const avgIPK = data.reduce((sum, item) => sum + parseFloat(item.ipk || 0), 0) / total || 0;

        return {
            total,
            accepted,
            acceptanceRate,
            highIPKPercent: total > 0 ? (highIPK / total * 100) : 0,
            lowIncomePercent: total > 0 ? (lowIncome / total * 100) : 0,
            activeOrgPercent: total > 0 ? (activeOrg / total * 100) : 0,
            activeUKMPercent: total > 0 ? (activeUKM / total * 100) : 0,
            avgIPK
        };
    };

    if (isLoading || loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <BarChart className="me-2" />
                        Quick Insights
                    </h6>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-info" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header className="bg-info text-white">
                <h6 className="mb-0">
                    <BarChart className="me-2" />
                    Quick Insights Dashboard
                </h6>
                <small>Ringkasan cepat data seleksi beasiswa</small>
            </Card.Header>
            <Card.Body>
                {insights && (
                    <>
                        <Row className="mb-4 text-center">
                            <Col xs={3}>
                                <div className="p-2 bg-primary bg-opacity-10 rounded">
                                    <Users className="text-primary mb-1" size={24} />
                                    <div className="fw-bold h5">{insights.total}</div>
                                    <small className="text-muted">Total Pendaftar</small>
                                </div>
                            </Col>
                            <Col xs={3}>
                                <div className="p-2 bg-success bg-opacity-10 rounded">
                                    <Award className="text-success mb-1" size={24} />
                                    <div className="fw-bold h5">{insights.accepted}</div>
                                    <small className="text-muted">Diterima</small>
                                </div>
                            </Col>
                            <Col xs={3}>
                                <div className="p-2 bg-warning bg-opacity-10 rounded">
                                    <TrendingUp className="text-warning mb-1" size={24} />
                                    <div className="fw-bold h5">{insights.acceptanceRate.toFixed(1)}%</div>
                                    <small className="text-muted">Tingkat Penerimaan</small>
                                </div>
                            </Col>
                            <Col xs={3}>
                                <div className="p-2 bg-info bg-opacity-10 rounded">
                                    <BarChart className="text-info mb-1" size={24} />
                                    <div className="fw-bold h5">{insights.avgIPK.toFixed(2)}</div>
                                    <small className="text-muted">Rata-rata IPK</small>
                                </div>
                            </Col>
                        </Row>

                        <div className="mb-3">
                            <h6 className="mb-3">Distribusi Karakteristik Pendaftar</h6>
                            
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small>IPK Tinggi (≥3.5)</small>
                                    <small>{insights.highIPKPercent.toFixed(1)}%</small>
                                </div>
                                <ProgressBar 
                                    variant="success" 
                                    now={insights.highIPKPercent} 
                                    style={{height: '8px'}}
                                />
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small>Penghasilan Rendah</small>
                                    <small>{insights.lowIncomePercent.toFixed(1)}%</small>
                                </div>
                                <ProgressBar 
                                    variant="info" 
                                    now={insights.lowIncomePercent} 
                                    style={{height: '8px'}}
                                />
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small>Aktif Organisasi</small>
                                    <small>{insights.activeOrgPercent.toFixed(1)}%</small>
                                </div>
                                <ProgressBar 
                                    variant="primary" 
                                    now={insights.activeOrgPercent} 
                                    style={{height: '8px'}}
                                />
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small>Aktif UKM</small>
                                    <small>{insights.activeUKMPercent.toFixed(1)}%</small>
                                </div>
                                <ProgressBar 
                                    variant="warning" 
                                    now={insights.activeUKMPercent} 
                                    style={{height: '8px'}}
                                />
                            </div>
                        </div>

                        <div className="mt-3 p-2 bg-light rounded">
                            <small className="text-muted">
                                📊 <strong>Summary:</strong> Dari {insights.total} pendaftar, {insights.accepted} diterima 
                                ({insights.acceptanceRate.toFixed(1)}%). Rata-rata IPK pendaftar adalah {insights.avgIPK.toFixed(2)}.
                            </small>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default QuickInsights;