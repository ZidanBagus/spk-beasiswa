import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Alert, Button } from 'react-bootstrap';
import { Lightbulb, CheckCircle, XCircle, ExclamationTriangle } from 'react-bootstrap-icons';
import reportService from '../services/reportService';

const SmartRecommendationEngine = ({ isLoading }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        generateRecommendations();
    }, []);

    const generateRecommendations = async () => {
        setLoading(true);
        try {
            const response = await reportService.getAllSelectionResults({ limit: 99999 });
            const results = response.results || [];
            
            const analysis = analyzeData(results);
            setInsights(analysis);
            setRecommendations(generateSmartRecommendations(analysis));
        } catch (error) {
            console.error('Error generating recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeData = (data) => {
        const total = data.length;
        const accepted = data.filter(item => (item.statusKelulusan || '').trim() === 'Terima').length;
        const acceptanceRate = total > 0 ? (accepted / total * 100) : 0;
        
        // Analisis IPK
        const avgIPKAccepted = data.filter(item => (item.statusKelulusan || '').trim() === 'Terima')
            .reduce((sum, item) => sum + parseFloat(item.ipk || 0), 0) / accepted || 0;
        const avgIPKRejected = data.filter(item => (item.statusKelulusan || '').trim() === 'Tidak')
            .reduce((sum, item) => sum + parseFloat(item.ipk || 0), 0) / (total - accepted) || 0;
        
        // Analisis Penghasilan
        const lowIncomeAccepted = data.filter(item => 
            (item.statusKelulusan || '').trim() === 'Terima' && item.penghasilanOrtu === 'Rendah'
        ).length;
        const lowIncomeTotal = data.filter(item => item.penghasilanOrtu === 'Rendah').length;
        
        // Analisis Organisasi
        const orgActiveAccepted = data.filter(item => 
            (item.statusKelulusan || '').trim() === 'Terima' && item.ikutOrganisasi === 'Ya'
        ).length;
        const orgActiveTotal = data.filter(item => item.ikutOrganisasi === 'Ya').length;

        return {
            total,
            accepted,
            acceptanceRate,
            avgIPKAccepted,
            avgIPKRejected,
            ipkDifference: avgIPKAccepted - avgIPKRejected,
            lowIncomeSuccessRate: lowIncomeTotal > 0 ? (lowIncomeAccepted / lowIncomeTotal * 100) : 0,
            orgSuccessRate: orgActiveTotal > 0 ? (orgActiveAccepted / orgActiveTotal * 100) : 0
        };
    };

    const generateSmartRecommendations = (analysis) => {
        const recs = [];

        // Rekomendasi berdasarkan tingkat penerimaan
        if (analysis.acceptanceRate < 50) {
            recs.push({
                type: 'warning',
                title: 'Tingkat Penerimaan Rendah',
                description: `Hanya ${analysis.acceptanceRate.toFixed(1)}% pendaftar yang diterima. Pertimbangkan untuk menyesuaikan kriteria seleksi.`,
                action: 'Tinjau ulang bobot kriteria atau tambah kuota beasiswa',
                priority: 'high'
            });
        }

        // Rekomendasi berdasarkan IPK
        if (analysis.ipkDifference > 0.5) {
            recs.push({
                type: 'success',
                title: 'IPK Sebagai Indikator Kuat',
                description: `Perbedaan IPK antara yang diterima (${analysis.avgIPKAccepted.toFixed(2)}) dan ditolak (${analysis.avgIPKRejected.toFixed(2)}) cukup signifikan.`,
                action: 'Pertahankan bobot IPK dalam kriteria seleksi',
                priority: 'medium'
            });
        }

        // Rekomendasi berdasarkan penghasilan
        if (analysis.lowIncomeSuccessRate > 70) {
            recs.push({
                type: 'info',
                title: 'Program Tepat Sasaran',
                description: `${analysis.lowIncomeSuccessRate.toFixed(1)}% pendaftar berpenghasilan rendah berhasil diterima.`,
                action: 'Program beasiswa sudah tepat sasaran untuk keluarga kurang mampu',
                priority: 'low'
            });
        }

        // Rekomendasi berdasarkan organisasi
        if (analysis.orgSuccessRate > 60) {
            recs.push({
                type: 'success',
                title: 'Keaktifan Organisasi Berpengaruh',
                description: `${analysis.orgSuccessRate.toFixed(1)}% mahasiswa aktif organisasi diterima beasiswa.`,
                action: 'Pertimbangkan meningkatkan bobot keaktifan organisasi',
                priority: 'medium'
            });
        }

        // Rekomendasi umum
        recs.push({
            type: 'info',
            title: 'Optimasi Proses Seleksi',
            description: 'Gunakan data historis untuk memprediksi tren pendaftaran periode berikutnya.',
            action: 'Siapkan strategi promosi dan sosialisasi yang lebih efektif',
            priority: 'low'
        });

        return recs.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    };

    const getIconByType = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-success" />;
            case 'warning': return <ExclamationTriangle className="text-warning" />;
            case 'info': return <Lightbulb className="text-info" />;
            default: return <XCircle className="text-danger" />;
        }
    };

    const getBadgeColor = (priority) => {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            default: return 'secondary';
        }
    };

    if (isLoading || loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <Lightbulb className="me-2" />
                        Smart Recommendation Engine
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
            <Card.Header className="bg-gradient-primary text-white">
                <h6 className="mb-0">
                    <Lightbulb className="me-2" />
                    Smart Recommendation Engine
                </h6>
                <small>Rekomendasi cerdas berdasarkan analisis data seleksi</small>
            </Card.Header>
            <Card.Body>
                {insights && (
                    <Row className="mb-3 text-center">
                        <Col xs={4}>
                            <div className="text-primary fw-bold h6">{insights.acceptanceRate.toFixed(1)}%</div>
                            <small className="text-muted">Tingkat Penerimaan</small>
                        </Col>
                        <Col xs={4}>
                            <div className="text-success fw-bold h6">{insights.avgIPKAccepted.toFixed(2)}</div>
                            <small className="text-muted">Rata-rata IPK Diterima</small>
                        </Col>
                        <Col xs={4}>
                            <div className="text-info fw-bold h6">{insights.lowIncomeSuccessRate.toFixed(1)}%</div>
                            <small className="text-muted">Sukses Penghasilan Rendah</small>
                        </Col>
                    </Row>
                )}

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {recommendations.map((rec, index) => (
                        <Alert key={index} variant="light" className="border-start border-4 mb-2" 
                               style={{ borderLeftColor: rec.type === 'success' ? '#198754' : rec.type === 'warning' ? '#ffc107' : '#0dcaf0' }}>
                            <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center mb-1">
                                        {getIconByType(rec.type)}
                                        <strong className="ms-2">{rec.title}</strong>
                                        <Badge bg={getBadgeColor(rec.priority)} className="ms-2 text-uppercase" style={{fontSize: '0.6rem'}}>
                                            {rec.priority}
                                        </Badge>
                                    </div>
                                    <div className="small text-muted mb-2">{rec.description}</div>
                                    <div className="small fw-semibold text-dark">💡 {rec.action}</div>
                                </div>
                            </div>
                        </Alert>
                    ))}
                </div>

                <div className="mt-3 text-center">
                    <Button variant="outline-primary" size="sm" onClick={generateRecommendations}>
                        🔄 Refresh Rekomendasi
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default SmartRecommendationEngine;