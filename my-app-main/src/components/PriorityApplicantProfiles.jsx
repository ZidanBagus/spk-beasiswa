import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Table, ProgressBar } from 'react-bootstrap';
import { PersonCheck, Star, Award } from 'react-bootstrap-icons';
import reportService from '../services/reportService';

const PriorityApplicantProfiles = ({ isLoading }) => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPriorityProfiles();
    }, []);

    const fetchPriorityProfiles = async () => {
        setLoading(true);
        try {
            const response = await reportService.getAllSelectionResults({ limit: 99999 });
            const results = response.results || [];
            
            const priorityData = analyzePriorityProfiles(results);
            setProfiles(priorityData);
        } catch (error) {
            console.error('Error fetching priority profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const analyzePriorityProfiles = (data) => {
        // Kategorikan berdasarkan profil prioritas
        const profiles = [
            {
                name: 'Berprestasi Akademik',
                criteria: 'IPK ≥ 3.5 + Aktif Organisasi',
                icon: <Award className="text-warning" />,
                color: 'warning',
                applicants: data.filter(item => 
                    parseFloat(item.ipk) >= 3.5 && item.ikutOrganisasi === 'Ya'
                )
            },
            {
                name: 'Kurang Mampu Berprestasi',
                criteria: 'Penghasilan Rendah + IPK ≥ 3.0',
                icon: <Star className="text-success" />,
                color: 'success',
                applicants: data.filter(item => 
                    item.penghasilanOrtu === 'Rendah' && parseFloat(item.ipk) >= 3.0
                )
            },
            {
                name: 'Tanggungan Keluarga Besar',
                criteria: 'Tanggungan > 3 + Penghasilan Rendah',
                icon: <PersonCheck className="text-info" />,
                color: 'info',
                applicants: data.filter(item => 
                    parseInt(item.jmlTanggungan) > 3 && item.penghasilanOrtu === 'Rendah'
                )
            },
            {
                name: 'Aktif Berorganisasi',
                criteria: 'Organisasi + UKM + IPK ≥ 3.0',
                icon: <PersonCheck className="text-primary" />,
                color: 'primary',
                applicants: data.filter(item => 
                    item.ikutOrganisasi === 'Ya' && item.ikutUKM === 'Ya' && parseFloat(item.ipk) >= 3.0
                )
            }
        ];

        return profiles.map(profile => {
            const total = profile.applicants.length;
            const accepted = profile.applicants.filter(item => 
                (item.statusKelulusan || '').trim() === 'Terima'
            ).length;
            const acceptanceRate = total > 0 ? (accepted / total * 100) : 0;
            const avgIPK = total > 0 ? 
                profile.applicants.reduce((sum, item) => sum + parseFloat(item.ipk || 0), 0) / total : 0;

            return {
                ...profile,
                total,
                accepted,
                rejected: total - accepted,
                acceptanceRate,
                avgIPK,
                topApplicants: profile.applicants
                    .sort((a, b) => parseFloat(b.ipk) - parseFloat(a.ipk))
                    .slice(0, 3)
            };
        }).sort((a, b) => b.acceptanceRate - a.acceptanceRate);
    };

    if (isLoading || loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <PersonCheck className="me-2" />
                        Profil Pendaftar Prioritas
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
                    <PersonCheck className="me-2" />
                    Profil Pendaftar Prioritas
                </h6>
                <small>Analisis kategori pendaftar berdasarkan kriteria prioritas beasiswa</small>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    {profiles.map((profile, index) => (
                        <Col md={6} key={index}>
                            <div className={`p-3 border border-${profile.color} rounded bg-${profile.color} bg-opacity-10`}>
                                <div className="d-flex align-items-center mb-2">
                                    {profile.icon}
                                    <div className="ms-2">
                                        <div className="fw-bold">{profile.name}</div>
                                        <small className="text-muted">{profile.criteria}</small>
                                    </div>
                                </div>
                                
                                <Row className="text-center mb-2">
                                    <Col xs={4}>
                                        <div className="fw-bold text-primary">{profile.total}</div>
                                        <small className="text-muted">Total</small>
                                    </Col>
                                    <Col xs={4}>
                                        <div className="fw-bold text-success">{profile.accepted}</div>
                                        <small className="text-muted">Diterima</small>
                                    </Col>
                                    <Col xs={4}>
                                        <div className="fw-bold text-warning">{profile.acceptanceRate.toFixed(1)}%</div>
                                        <small className="text-muted">Tingkat</small>
                                    </Col>
                                </Row>

                                <div className="mb-2">
                                    <div className="d-flex justify-content-between mb-1">
                                        <small>Tingkat Penerimaan</small>
                                        <small>{profile.acceptanceRate.toFixed(1)}%</small>
                                    </div>
                                    <ProgressBar 
                                        variant={profile.color} 
                                        now={profile.acceptanceRate} 
                                        style={{height: '6px'}}
                                    />
                                </div>

                                <div className="text-center">
                                    <Badge bg={profile.color} className="px-2 py-1">
                                        Rata-rata IPK: {profile.avgIPK.toFixed(2)}
                                    </Badge>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                <div className="mt-4">
                    <h6 className="mb-3">📊 Rekomendasi Prioritas Seleksi:</h6>
                    <div className="row">
                        {profiles.slice(0, 2).map((profile, index) => (
                            <div key={index} className="col-md-6 mb-2">
                                <div className="alert alert-light border-start border-4 mb-2" 
                                     style={{borderLeftColor: profile.color === 'warning' ? '#ffc107' : '#198754'}}>
                                    <small>
                                        <strong>#{index + 1} {profile.name}</strong><br/>
                                        Tingkat penerimaan: <strong>{profile.acceptanceRate.toFixed(1)}%</strong><br/>
                                        <em>Prioritas {index === 0 ? 'Tertinggi' : 'Tinggi'} untuk seleksi beasiswa</em>
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-3 p-2 bg-light rounded">
                    <small className="text-muted">
                        💡 <strong>Insight:</strong> Profil "{profiles[0]?.name}" memiliki tingkat penerimaan tertinggi ({profiles[0]?.acceptanceRate.toFixed(1)}%). 
                        Fokuskan seleksi pada kategori ini untuk hasil optimal.
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
};

export default PriorityApplicantProfiles;