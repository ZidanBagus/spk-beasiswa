import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Alert, Badge } from 'react-bootstrap';
import { Calculator, TrophyFill } from 'react-bootstrap-icons';

const WhatIfCalculator = ({ currentStats }) => {
    const [weights, setWeights] = useState({
        ipk: 30,
        penghasilan: 25,
        tanggungan: 20,
        organisasi: 15,
        ukm: 10
    });
    
    const [simulatedResults, setSimulatedResults] = useState(null);

    const handleWeightChange = (criterion, value) => {
        const newWeights = { ...weights, [criterion]: parseInt(value) };
        const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
        
        if (total <= 100) {
            setWeights(newWeights);
        }
    };

    const calculateSimulation = () => {
        // Mock simulation - replace with actual calculation
        const baseAcceptanceRate = 65;
        const weightImpact = {
            ipk: weights.ipk * 0.8,
            penghasilan: weights.penghasilan * 0.6,
            tanggungan: weights.tanggungan * 0.4,
            organisasi: weights.organisasi * 0.5,
            ukm: weights.ukm * 0.3
        };
        
        const totalImpact = Object.values(weightImpact).reduce((sum, impact) => sum + impact, 0);
        const newAcceptanceRate = Math.min(95, Math.max(10, baseAcceptanceRate + (totalImpact - 50)));
        
        setSimulatedResults({
            acceptanceRate: newAcceptanceRate.toFixed(1),
            expectedAccepted: Math.round((currentStats?.totalApplicants || 100) * newAcceptanceRate / 100),
            idealProfile: getIdealProfile(weights)
        });
    };

    const getIdealProfile = (currentWeights) => {
        const sortedCriteria = Object.entries(currentWeights)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        return sortedCriteria.map(([criterion, weight]) => ({
            criterion: criterion.toUpperCase(),
            weight,
            description: getProfileDescription(criterion)
        }));
    };

    const getProfileDescription = (criterion) => {
        const descriptions = {
            ipk: 'IPK > 3.5',
            penghasilan: 'Penghasilan Orang Tua Rendah',
            tanggungan: 'Jumlah Tanggungan > 3',
            organisasi: 'Aktif di Organisasi',
            ukm: 'Aktif di UKM'
        };
        return descriptions[criterion] || criterion;
    };

    useEffect(() => {
        calculateSimulation();
    }, [weights]);

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

    return (
        <Card className="h-100">
            <Card.Header className="bg-warning bg-opacity-10">
                <h6 className="mb-0">
                    <Calculator className="me-2" />
                    What-If Calculator & Profil Ideal
                </h6>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    <Col md={6}>
                        <h6 className="text-primary mb-3">Simulasi Bobot Kriteria</h6>
                        {Object.entries(weights).map(([criterion, weight]) => (
                            <div key={criterion} className="mb-2">
                                <Form.Label className="text-capitalize small fw-semibold">
                                    {criterion}: {weight}%
                                </Form.Label>
                                <Form.Range
                                    min="0"
                                    max="50"
                                    value={weight}
                                    onChange={(e) => handleWeightChange(criterion, e.target.value)}
                                />
                            </div>
                        ))}
                        <Alert variant={totalWeight === 100 ? 'success' : 'warning'} className="py-2">
                            <small>Total Bobot: {totalWeight}% {totalWeight !== 100 && '(Harus 100%)'}</small>
                        </Alert>
                    </Col>
                    
                    <Col md={6}>
                        <h6 className="text-success mb-3">
                            <TrophyFill className="me-2" />
                            Hasil Simulasi
                        </h6>
                        {simulatedResults && (
                            <>
                                <div className="bg-light p-3 rounded mb-3">
                                    <div className="text-center">
                                        <h4 className="text-primary mb-1">{simulatedResults.acceptanceRate}%</h4>
                                        <small className="text-muted">Tingkat Penerimaan Prediksi</small>
                                    </div>
                                    <div className="text-center mt-2">
                                        <Badge bg="info">{simulatedResults.expectedAccepted} mahasiswa diterima</Badge>
                                    </div>
                                </div>
                                
                                <div>
                                    <h6 className="text-warning mb-2">Profil Pendaftar Ideal:</h6>
                                    {simulatedResults.idealProfile.map((profile, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                                            <small>{profile.description}</small>
                                            <Badge bg="primary">{profile.weight}%</Badge>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default WhatIfCalculator;