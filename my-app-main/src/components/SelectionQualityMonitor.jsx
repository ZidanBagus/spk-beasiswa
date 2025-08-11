import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Alert, Table } from 'react-bootstrap';
import { ShieldCheck, ExclamationTriangle, CheckCircle } from 'react-bootstrap-icons';
import reportService from '../services/reportService';

const SelectionQualityMonitor = ({ isLoading }) => {
    const [qualityMetrics, setQualityMetrics] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchQualityMetrics();
    }, []);

    const fetchQualityMetrics = async () => {
        setLoading(true);
        try {
            const response = await reportService.getAllSelectionResults({ limit: 99999 });
            const results = response.results || [];
            
            const metrics = calculateQualityMetrics(results);
            setQualityMetrics(metrics);
            setAlerts(generateQualityAlerts(metrics));
        } catch (error) {
            console.error('Error fetching quality metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateQualityMetrics = (data) => {
        const total = data.length;
        const accepted = data.filter(item => (item.statusKelulusan || '').trim() === 'Terima');
        const rejected = data.filter(item => (item.statusKelulusan || '').trim() === 'Tidak');

        // Kualitas IPK yang diterima
        const avgIPKAccepted = accepted.length > 0 ? 
            accepted.reduce((sum, item) => sum + parseFloat(item.ipk || 0), 0) / accepted.length : 0;
        const avgIPKRejected = rejected.length > 0 ? 
            rejected.reduce((sum, item) => sum + parseFloat(item.ipk || 0), 0) / rejected.length : 0;

        // Distribusi penghasilan yang diterima
        const lowIncomeAccepted = accepted.filter(item => item.penghasilanOrtu === 'Rendah').length;
        const lowIncomePercentage = accepted.length > 0 ? (lowIncomeAccepted / accepted.length * 100) : 0;

        // Keaktifan organisasi yang diterima
        const activeOrgAccepted = accepted.filter(item => item.ikutOrganisasi === 'Ya').length;
        const activeOrgPercentage = accepted.length > 0 ? (activeOrgAccepted / accepted.length * 100) : 0;

        // Konsistensi seleksi berdasarkan IPK
        const highIPKTotal = data.filter(item => parseFloat(item.ipk) >= 3.5).length;
        const highIPKAccepted = accepted.filter(item => parseFloat(item.ipk) >= 3.5).length;
        const ipkConsistency = highIPKTotal > 0 ? (highIPKAccepted / highIPKTotal * 100) : 0;

        // Efektivitas targeting (penghasilan rendah + IPK baik)
        const targetGroup = data.filter(item => 
            item.penghasilanOrtu === 'Rendah' && parseFloat(item.ipk) >= 3.0
        );
        const targetGroupAccepted = accepted.filter(item => 
            item.penghasilanOrtu === 'Rendah' && parseFloat(item.ipk) >= 3.0
        ).length;
        const targetingEffectiveness = targetGroup.length > 0 ? (targetGroupAccepted / targetGroup.length * 100) : 0;

        return {
            total,
            acceptedCount: accepted.length,
            rejectedCount: rejected.length,
            acceptanceRate: total > 0 ? (accepted.length / total * 100) : 0,
            avgIPKAccepted,
            avgIPKRejected,
            ipkDifference: avgIPKAccepted - avgIPKRejected,
            lowIncomePercentage,
            activeOrgPercentage,
            ipkConsistency,
            targetingEffectiveness,
            qualityScore: calculateOverallQuality(avgIPKAccepted, lowIncomePercentage, ipkConsistency, targetingEffectiveness)
        };
    };

    const calculateOverallQuality = (avgIPK, lowIncome, consistency, targeting) => {
        // Skor kualitas berdasarkan 4 faktor (0-100)
        const ipkScore = Math.min((avgIPK / 4.0) * 100, 100);
        const targetScore = Math.min(lowIncome, 100);
        const consistencyScore = Math.min(consistency, 100);
        const targetingScore = Math.min(targeting, 100);
        
        return (ipkScore * 0.3 + targetScore * 0.25 + consistencyScore * 0.25 + targetingScore * 0.2);
    };

    const generateQualityAlerts = (metrics) => {
        const alerts = [];

        if (metrics.qualityScore >= 80) {
            alerts.push({
                type: 'success',
                title: 'Kualitas Seleksi Excellent',
                message: `Skor kualitas ${metrics.qualityScore.toFixed(1)}/100. Proses seleksi berjalan sangat baik!`
            });
        } else if (metrics.qualityScore >= 60) {
            alerts.push({
                type: 'warning',
                title: 'Kualitas Seleksi Baik',
                message: `Skor kualitas ${metrics.qualityScore.toFixed(1)}/100. Ada ruang untuk perbaikan.`
            });
        } else {
            alerts.push({
                type: 'danger',
                title: 'Kualitas Seleksi Perlu Perbaikan',
                message: `Skor kualitas ${metrics.qualityScore.toFixed(1)}/100. Evaluasi kriteria seleksi diperlukan.`
            });
        }

        if (metrics.ipkDifference < 0.2) {
            alerts.push({
                type: 'warning',
                title: 'Perbedaan IPK Rendah',
                message: 'IPK rata-rata yang diterima dan ditolak terlalu mirip. Periksa kriteria IPK.'
            });
        }

        if (metrics.lowIncomePercentage < 50) {
            alerts.push({
                type: 'info',
                title: 'Target Keluarga Kurang Mampu',
                message: `Hanya ${metrics.lowIncomePercentage.toFixed(1)}% penerima dari keluarga berpenghasilan rendah.`
            });
        }

        return alerts;
    };

    const getQualityBadge = (score) => {
        if (score >= 80) return { variant: 'success', text: 'Excellent' };
        if (score >= 60) return { variant: 'warning', text: 'Baik' };
        return { variant: 'danger', text: 'Perlu Perbaikan' };
    };

    if (isLoading || loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <ShieldCheck className="me-2" />
                        Monitor Kualitas Seleksi
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
                <h6 className="mb-0">
                    <ShieldCheck className="me-2" />
                    Monitor Kualitas Seleksi
                </h6>
                <small>Evaluasi kualitas dan efektivitas proses seleksi beasiswa</small>
            </Card.Header>
            <Card.Body>
                {qualityMetrics && (
                    <>
                        {/* Overall Quality Score */}
                        <div className="text-center mb-4 p-3 bg-light rounded">
                            <div className="h2 mb-1">
                                <Badge bg={getQualityBadge(qualityMetrics.qualityScore).variant} className="px-3 py-2">
                                    {qualityMetrics.qualityScore.toFixed(1)}/100
                                </Badge>
                            </div>
                            <div className="fw-bold">Skor Kualitas Seleksi</div>
                            <small className="text-muted">
                                Status: {getQualityBadge(qualityMetrics.qualityScore).text}
                            </small>
                        </div>

                        {/* Key Metrics */}
                        <Row className="g-3 mb-3">
                            <Col xs={6}>
                                <div className="text-center p-2 border rounded">
                                    <div className="fw-bold text-primary">{qualityMetrics.avgIPKAccepted.toFixed(2)}</div>
                                    <small className="text-muted">IPK Rata-rata Diterima</small>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="text-center p-2 border rounded">
                                    <div className="fw-bold text-success">{qualityMetrics.lowIncomePercentage.toFixed(1)}%</div>
                                    <small className="text-muted">Penghasilan Rendah</small>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="text-center p-2 border rounded">
                                    <div className="fw-bold text-warning">{qualityMetrics.ipkConsistency.toFixed(1)}%</div>
                                    <small className="text-muted">Konsistensi IPK</small>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="text-center p-2 border rounded">
                                    <div className="fw-bold text-info">{qualityMetrics.targetingEffectiveness.toFixed(1)}%</div>
                                    <small className="text-muted">Efektivitas Target</small>
                                </div>
                            </Col>
                        </Row>

                        {/* Quality Alerts */}
                        {alerts.length > 0 && (
                            <div className="mb-3">
                                <h6 className="mb-2">🚨 Status & Rekomendasi:</h6>
                                {alerts.map((alert, index) => (
                                    <Alert key={index} variant={alert.type} className="py-2 mb-2">
                                        <div className="d-flex align-items-center">
                                            {alert.type === 'success' && <CheckCircle className="me-2" />}
                                            {alert.type === 'warning' && <ExclamationTriangle className="me-2" />}
                                            {alert.type === 'danger' && <ExclamationTriangle className="me-2" />}
                                            <div>
                                                <strong>{alert.title}</strong><br/>
                                                <small>{alert.message}</small>
                                            </div>
                                        </div>
                                    </Alert>
                                ))}
                            </div>
                        )}

                        {/* Quality Breakdown */}
                        <div className="mt-3">
                            <h6 className="mb-2">📋 Detail Evaluasi:</h6>
                            <Table size="sm" className="mb-0">
                                <tbody>
                                    <tr>
                                        <td><small>Perbedaan IPK (Diterima vs Ditolak)</small></td>
                                        <td className="text-end">
                                            <Badge bg={qualityMetrics.ipkDifference >= 0.3 ? 'success' : 'warning'}>
                                                +{qualityMetrics.ipkDifference.toFixed(2)}
                                            </Badge>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><small>Mahasiswa Aktif Organisasi Diterima</small></td>
                                        <td className="text-end">
                                            <Badge bg="primary">{qualityMetrics.activeOrgPercentage.toFixed(1)}%</Badge>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><small>Tingkat Penerimaan Keseluruhan</small></td>
                                        <td className="text-end">
                                            <Badge bg="info">{qualityMetrics.acceptanceRate.toFixed(1)}%</Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </div>

                        <div className="mt-3 p-2 bg-light rounded">
                            <small className="text-muted">
                                ⚡ <strong>Update Otomatis:</strong> Metrik kualitas diperbarui setiap kali ada proses seleksi baru. 
                                Gunakan insight ini untuk evaluasi dan perbaikan berkelanjutan.
                            </small>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default SelectionQualityMonitor;