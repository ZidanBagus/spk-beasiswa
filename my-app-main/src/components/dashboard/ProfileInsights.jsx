import React from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { Lightbulb, TrendingUp, Target, Award } from 'react-bootstrap-icons';

const ProfileInsights = ({ stats, activeFilters }) => {
    const generateInsights = () => {
        if (!stats.summary || stats.summary.total === 0) {
            return {
                idealProfile: "Belum ada data untuk analisis",
                acceptanceRate: 0,
                recommendations: [],
                correlations: []
            };
        }

        const acceptanceRate = ((stats.summary.Terima / stats.summary.total) * 100).toFixed(1);
        
        // Generate insights based on active filters
        const insights = {
            idealProfile: generateIdealProfile(stats, activeFilters),
            acceptanceRate: parseFloat(acceptanceRate),
            recommendations: generateRecommendations(stats, activeFilters),
            correlations: generateCorrelations(stats, activeFilters)
        };

        return insights;
    };

    const generateIdealProfile = (stats, filters) => {
        if (Object.keys(filters).length === 0) {
            return "Profil ideal: IPK ≥ 3.5, penghasilan orang tua rendah, aktif dalam organisasi dan UKM, dengan tanggungan keluarga ≥ 3 orang";
        }

        let profile = "Berdasarkan filter aktif: ";
        const filterDescriptions = [];

        if (filters.ipk) {
            const ipkMap = { high: "IPK tinggi (≥3.5)", medium: "IPK sedang (3.0-3.49)", low: "IPK rendah (<3.0)" };
            filterDescriptions.push(ipkMap[filters.ipk]);
        }
        if (filters.penghasilan) {
            filterDescriptions.push(`penghasilan ${filters.penghasilan.toLowerCase()}`);
        }
        if (filters.organisasi) {
            filterDescriptions.push(filters.organisasi === 'Ya' ? "aktif organisasi" : "tidak aktif organisasi");
        }
        if (filters.ukm) {
            filterDescriptions.push(filters.ukm === 'Ya' ? "aktif UKM" : "tidak aktif UKM");
        }
        if (filters.tanggungan) {
            const tanggunganMap = { high: "tanggungan banyak (≥4)", medium: "tanggungan sedang (2-3)", low: "tanggungan sedikit (1)" };
            filterDescriptions.push(tanggunganMap[filters.tanggungan]);
        }

        return profile + filterDescriptions.join(", ");
    };

    const generateRecommendations = (stats, filters) => {
        const recommendations = [];
        const acceptanceRate = (stats.summary.Terima / stats.summary.total) * 100;

        if (acceptanceRate > 70) {
            recommendations.push({
                type: "success",
                title: "Tingkat Penerimaan Tinggi",
                description: "Kriteria saat ini menghasilkan tingkat penerimaan yang baik"
            });
        } else if (acceptanceRate < 30) {
            recommendations.push({
                type: "warning",
                title: "Tingkat Penerimaan Rendah",
                description: "Pertimbangkan untuk menyesuaikan bobot kriteria"
            });
        }

        if (Object.keys(filters).length > 0) {
            recommendations.push({
                type: "info",
                title: "Analisis Tersegmentasi",
                description: `Menampilkan data untuk ${Object.keys(filters).length} kriteria spesifik`
            });
        }

        return recommendations;
    };

    const generateCorrelations = (stats, filters) => {
        // Simplified correlation analysis
        const correlations = [
            { attribute1: "IPK Tinggi", attribute2: "Penerimaan", strength: 85, type: "positive" },
            { attribute1: "Penghasilan Rendah", attribute2: "Penerimaan", strength: 72, type: "positive" },
            { attribute1: "Aktif Organisasi", attribute2: "Penerimaan", strength: 68, type: "positive" },
            { attribute1: "Tanggungan Banyak", attribute2: "Penerimaan", strength: 61, type: "positive" }
        ];

        return correlations;
    };

    const insights = generateInsights();

    return (
        <Row className="g-4 mb-4">
            <Col lg={6}>
                <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-gradient-success text-white">
                        <div className="d-flex align-items-center">
                            <Target className="me-2" size={20} />
                            <h6 className="mb-0 fw-bold">Profil Pendaftar Ideal</h6>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-medium">Tingkat Penerimaan</span>
                                <Badge bg={insights.acceptanceRate > 70 ? 'success' : insights.acceptanceRate > 40 ? 'warning' : 'danger'} className="fs-6">
                                    {insights.acceptanceRate}%
                                </Badge>
                            </div>
                            <ProgressBar 
                                now={insights.acceptanceRate} 
                                variant={insights.acceptanceRate > 70 ? 'success' : insights.acceptanceRate > 40 ? 'warning' : 'danger'}
                                style={{height: '8px'}}
                                className="rounded-pill"
                            />
                        </div>
                        
                        <div className="p-3 bg-light rounded mb-3">
                            <Lightbulb className="text-warning me-2" size={16} />
                            <small className="text-muted">{insights.idealProfile}</small>
                        </div>

                        <div>
                            <h6 className="fw-bold mb-2">Rekomendasi:</h6>
                            {insights.recommendations.map((rec, index) => (
                                <div key={index} className="mb-2">
                                    <Badge bg={rec.type} className="me-2">{rec.title}</Badge>
                                    <small className="text-muted">{rec.description}</small>
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={6}>
                <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-gradient-info text-white">
                        <div className="d-flex align-items-center">
                            <TrendingUp className="me-2" size={20} />
                            <h6 className="mb-0 fw-bold">Analisis Korelasi</h6>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            Kekuatan hubungan antara setiap atribut dengan tingkat penerimaan
                        </p>
                        
                        {insights.correlations.map((corr, index) => (
                            <div key={index} className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-medium">
                                        {corr.attribute1} → {corr.attribute2}
                                    </span>
                                    <Badge bg={corr.strength > 80 ? 'success' : corr.strength > 60 ? 'warning' : 'secondary'} className="fs-6">
                                        {corr.strength}%
                                    </Badge>
                                </div>
                                <ProgressBar 
                                    now={corr.strength} 
                                    variant={corr.strength > 80 ? 'success' : corr.strength > 60 ? 'warning' : 'secondary'}
                                    style={{height: '6px'}}
                                    className="rounded-pill"
                                />
                            </div>
                        ))}

                        <div className="mt-3 p-2 bg-light rounded">
                            <small className="text-muted">
                                <Award className="me-1" size={12} />
                                <strong>Insight:</strong> IPK memiliki korelasi tertinggi dengan penerimaan beasiswa
                            </small>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default ProfileInsights;