import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { Speedometer2, TrendingUp, TrendingDown, Dash } from 'react-bootstrap-icons';
import reportService from '../services/reportService';

const PerformanceMonitor = ({ isLoading }) => {
    const [metrics, setMetrics] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchPerformanceMetrics();
        }, 30000); // Update setiap 30 detik

        fetchPerformanceMetrics();
        return () => clearInterval(interval);
    }, []);

    const fetchPerformanceMetrics = async () => {
        setLoading(true);
        try {
            const response = await reportService.getAllSelectionResults({ limit: 99999 });
            const results = response.results || [];
            
            const performanceData = calculateMetrics(results);
            setMetrics(performanceData);
            setAlerts(generateAlerts(performanceData));
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = (data) => {
        const total = data.length;
        const accepted = data.filter(item => (item.statusKelulusan || '').trim() === 'Terima').length;
        const rejected = total - accepted;
        
        // Efisiensi seleksi
        const selectionEfficiency = total > 0 ? (accepted / total * 100) : 0;
        
        // Kualitas pendaftar (berdasarkan IPK)
        const avgIPK = data.reduce((sum, item) => sum + parseFloat(item.ipk || 0), 0) / total || 0;
        const qualityScore = Math.min((avgIPK / 4.0) * 100, 100);
        
        // Distribusi kebutuhan (penghasilan rendah)
        const needyApplicants = data.filter(item => item.penghasilanOrtu === 'Rendah').length;
        const needCoverage = total > 0 ? (needyApplicants / total * 100) : 0;
        
        // Aktivitas mahasiswa (organisasi + UKM)
        const activeStudents = data.filter(item => 
            item.ikutOrganisasi === 'Ya' || item.ikutUKM === 'Ya'
        ).length;
        const activityRate = total > 0 ? (activeStudents / total * 100) : 0;
        
        // Konsistensi kriteria
        const highIPKAccepted = data.filter(item => 
            parseFloat(item.ipk) >= 3.5 && (item.statusKelulusan || '').trim() === 'Terima'
        ).length;
        const highIPKTotal = data.filter(item => parseFloat(item.ipk) >= 3.5).length;
        const consistencyScore = highIPKTotal > 0 ? (highIPKAccepted / highIPKTotal * 100) : 0;

        return {
            total,
            accepted,
            rejected,
            selectionEfficiency,
            qualityScore,
            needCoverage,
            activityRate,
            consistencyScore,
            avgIPK,
            lastUpdated: new Date().toLocaleTimeString('id-ID')
        };
    };

    const generateAlerts = (metrics) => {
        const alerts = [];
        
        if (metrics.selectionEfficiency < 30) {
            alerts.push({
                type: 'danger',
                message: 'Tingkat penerimaan sangat rendah! Pertimbangkan menyesuaikan kriteria.',
                metric: 'Efisiensi Seleksi'
            });
        }
        
        if (metrics.qualityScore < 60) {
            alerts.push({
                type: 'warning',
                message: 'Kualitas rata-rata pendaftar di bawah standar optimal.',
                metric: 'Kualitas Pendaftar'
            });
        }
        
        if (metrics.needCoverage > 80) {
            alerts.push({
                type: 'success',
                message: 'Excellent! Program beasiswa tepat sasaran untuk keluarga kurang mampu.',
                metric: 'Cakupan Kebutuhan'
            });
        }
        
        if (metrics.consistencyScore < 70) {
            alerts.push({
                type: 'warning',
                message: 'Konsistensi penerapan kriteria IPK perlu ditingkatkan.',
                metric: 'Konsistensi Kriteria'
            });
        }

        return alerts;
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    };

    const getTrendIcon = (score) => {
        if (score >= 75) return <TrendingUp className="text-success" />;
        if (score >= 50) return <Dash className="text-warning" />;
        return <TrendingDown className="text-danger" />;
    };

    if (isLoading || loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <Speedometer2 className="me-2" />
                        Real-time Performance Monitor
                    </h6>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-success" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header className="bg-gradient-success text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-0">
                            <Speedometer2 className="me-2" />
                            Real-time Performance Monitor
                        </h6>
                        <small>Monitoring kinerja sistem seleksi secara real-time</small>
                    </div>
                    <Badge bg="light" text="dark" className="px-2">
                        Live • {metrics?.lastUpdated}
                    </Badge>
                </div>
            </Card.Header>
            <Card.Body>
                {metrics && (
                    <>
                        <Row className="g-3 mb-3">
                            <Col xs={6}>
                                <div className="text-center p-2 bg-light rounded">
                                    <div className="d-flex align-items-center justify-content-center mb-1">
                                        {getTrendIcon(metrics.selectionEfficiency)}
                                        <span className="fw-bold ms-1">Efisiensi Seleksi</span>
                                    </div>
                                    <div className="h5 mb-1">{metrics.selectionEfficiency.toFixed(1)}%</div>
                                    <ProgressBar 
                                        variant={getScoreColor(metrics.selectionEfficiency)} 
                                        now={metrics.selectionEfficiency} 
                                        style={{height: '4px'}}
                                    />
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="text-center p-2 bg-light rounded">
                                    <div className="d-flex align-items-center justify-content-center mb-1">
                                        {getTrendIcon(metrics.qualityScore)}
                                        <span className="fw-bold ms-1">Kualitas Pendaftar</span>
                                    </div>
                                    <div className="h5 mb-1">{metrics.qualityScore.toFixed(1)}%</div>
                                    <ProgressBar 
                                        variant={getScoreColor(metrics.qualityScore)} 
                                        now={metrics.qualityScore} 
                                        style={{height: '4px'}}
                                    />
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="text-center p-2 bg-light rounded">
                                    <div className="d-flex align-items-center justify-content-center mb-1">
                                        {getTrendIcon(metrics.needCoverage)}
                                        <span className="fw-bold ms-1">Cakupan Kebutuhan</span>
                                    </div>
                                    <div className="h5 mb-1">{metrics.needCoverage.toFixed(1)}%</div>
                                    <ProgressBar 
                                        variant={getScoreColor(metrics.needCoverage)} 
                                        now={metrics.needCoverage} 
                                        style={{height: '4px'}}
                                    />
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="text-center p-2 bg-light rounded">
                                    <div className="d-flex align-items-center justify-content-center mb-1">
                                        {getTrendIcon(metrics.consistencyScore)}
                                        <span className="fw-bold ms-1">Konsistensi Kriteria</span>
                                    </div>
                                    <div className="h5 mb-1">{metrics.consistencyScore.toFixed(1)}%</div>
                                    <ProgressBar 
                                        variant={getScoreColor(metrics.consistencyScore)} 
                                        now={metrics.consistencyScore} 
                                        style={{height: '4px'}}
                                    />
                                </div>
                            </Col>
                        </Row>

                        {alerts.length > 0 && (
                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {alerts.map((alert, index) => (
                                    <Alert key={index} variant={alert.type} className="py-2 mb-2">
                                        <div className="d-flex align-items-center">
                                            <Badge bg={alert.type} className="me-2">{alert.metric}</Badge>
                                            <small>{alert.message}</small>
                                        </div>
                                    </Alert>
                                ))}
                            </div>
                        )}

                        <div className="mt-3 p-2 bg-light rounded">
                            <small className="text-muted">
                                📊 <strong>Status:</strong> Monitoring {metrics.total} pendaftar • 
                                {metrics.accepted} diterima • {metrics.rejected} ditolak • 
                                Update otomatis setiap 30 detik
                            </small>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default PerformanceMonitor;