import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Badge, Row, Col, Table } from 'react-bootstrap';
import { BarChart, CheckCircle, Clock, Cpu, Eye } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import selectionService from '../../services/selectionService';
import { toast } from 'react-toastify';
import './TreeVisualization.css';

const TreeVisualization = ({ isModelTrained }) => {
    const [modelSummary, setModelSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadModelSummary = async () => {
        if (!isModelTrained) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await selectionService.getTreeVisualization();
            setModelSummary(response);
        } catch (error) {
            setError(error.message || 'Gagal memuat ringkasan model');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isModelTrained) {
            loadModelSummary();
        }
    }, [isModelTrained]);

    const getModelStats = () => {
        if (!modelSummary) return null;
        
        return {
            totalNodes: modelSummary.steps?.length || 0,
            totalAttributes: new Set(modelSummary.steps?.map(s => s.bestAttribute).filter(Boolean)).size || 0,
            avgEntropy: modelSummary.steps?.length > 0 ? 
                (modelSummary.steps.reduce((sum, s) => sum + (s.entropy || 0), 0) / modelSummary.steps.length).toFixed(4) : 0,
            accuracy: modelSummary.accuracy || null
        };
    };



    if (!isModelTrained) {
        return (
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-gradient-info text-white">
                    <div className="d-flex align-items-center">
                        <BarChart className="me-2" size={20} />
                        <h6 className="mb-0 fw-semibold">Ringkasan Model C4.5</h6>
                    </div>
                </Card.Header>
                <Card.Body className="text-center py-5">
                    <Cpu size={64} className="text-muted mb-3" />
                    <h6 className="text-muted mb-2">Model Belum Tersedia</h6>
                    <p className="text-muted mb-3">Bangun pohon keputusan terlebih dahulu untuk melihat ringkasan model.</p>
                    <Button as={Link} to="/simulasi-c45" variant="outline-primary" size="sm">
                        <Eye className="me-1" size={14} /> Lihat Visualisasi Pohon
                    </Button>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-gradient-info text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <BarChart className="me-2" size={20} />
                        <h6 className="mb-0 fw-semibold">Ringkasan Model C4.5</h6>
                    </div>
                    <Button as={Link} to="/simulasi-c45" variant="light" size="sm">
                        <Eye className="me-1" size={12} /> Lihat Pohon
                    </Button>
                </div>
            </Card.Header>
            
            <Card.Body>
                {isLoading && (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                        Memuat ringkasan model...
                    </div>
                )}
                
                {error && (
                    <Alert variant="danger" className="mb-0">
                        {error}
                        <div className="mt-2">
                            <Button variant="outline-danger" size="sm" onClick={loadModelSummary}>
                                Coba Lagi
                            </Button>
                        </div>
                    </Alert>
                )}
                
                {modelSummary && !isLoading && (
                    <>
                        <Row className="g-3 mb-4">
                            <Col md={3}>
                                <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                                    <BarChart className="text-primary mb-2" size={24} />
                                    <div className="fw-bold text-primary">{getModelStats()?.totalNodes || 0}</div>
                                    <small className="text-muted">Total Node</small>
                                </div>
                            </Col>
                            <Col md={3}>
                                <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                                    <CheckCircle className="text-success mb-2" size={24} />
                                    <div className="fw-bold text-success">{getModelStats()?.totalAttributes || 0}</div>
                                    <small className="text-muted">Atribut Digunakan</small>
                                </div>
                            </Col>
                            <Col md={3}>
                                <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                                    <Cpu className="text-info mb-2" size={24} />
                                    <div className="fw-bold text-info">{getModelStats()?.avgEntropy || '0.0000'}</div>
                                    <small className="text-muted">Rata-rata Entropy</small>
                                </div>
                            </Col>
                            <Col md={3}>
                                <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                                    <Clock className="text-warning mb-2" size={24} />
                                    <div className="fw-bold text-warning">Siap</div>
                                    <small className="text-muted">Status Model</small>
                                </div>
                            </Col>
                        </Row>
                        
                        {modelSummary.steps && modelSummary.steps.length > 0 && (
                            <div>
                                <h6 className="fw-semibold mb-3">Atribut Terpenting (Top 5)</h6>
                                <Table size="sm" className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Ranking</th>
                                            <th>Atribut</th>
                                            <th>Gain Ratio</th>
                                            <th>Entropy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modelSummary.steps
                                            .filter(step => step.bestAttribute)
                                            .slice(0, 5)
                                            .map((step, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <Badge bg="primary" className="fs-6">
                                                            #{index + 1}
                                                        </Badge>
                                                    </td>
                                                    <td className="fw-medium">
                                                        {step.bestAttribute?.replace('_kategori', '') || 'N/A'}
                                                    </td>
                                                    <td>
                                                        <Badge bg="success" className="fs-6">
                                                            {step.calculations?.[step.bestAttribute]?.gainRatio?.toFixed(4) || 'N/A'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge bg="info" className="fs-6">
                                                            {step.entropy?.toFixed(4) || 'N/A'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default TreeVisualization;
