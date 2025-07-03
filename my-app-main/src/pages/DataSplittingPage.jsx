// src/pages/DataSplittingPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Form, Spinner, Alert, Table, Badge, ProgressBar, ButtonGroup, Modal } from 'react-bootstrap';
import { FunnelFill, ClipboardData, Download, Eye, Shuffle, CheckCircle, XCircle, InfoCircle } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import applicantService from '../services/applicantService';
import { toast } from 'react-toastify';
import './DataSplittingPage.css';

const DataSplittingPage = () => {
    const [allApplicants, setAllApplicants] = useState([]);
    const [trainingSet, setTrainingSet] = useState([]);
    const [testingSet, setTestingSet] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitRatio, setSplitRatio] = useState(0.7);
    const [stratifiedSplit, setStratifiedSplit] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState({ type: '', data: [] });
    
    const navigate = useNavigate();

    // Fungsi untuk mengambil semua data pendaftar dari backend
    const fetchAllApplicants = useCallback(async () => {
        setIsLoading(true);
        try {
            // Mengambil semua data pendaftar sekaligus
            const data = await applicantService.getAllApplicants({ limit: 10000 }); 
            setAllApplicants(data.applicants || []);
            // Reset hasil split sebelumnya setiap kali data baru diambil
            setTrainingSet([]);
            setTestingSet([]);
        } catch (err) {
            toast.error(err.message || 'Gagal memuat data pendaftar.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Jalankan pengambilan data saat halaman pertama kali dimuat
    useEffect(() => {
        fetchAllApplicants();
    }, [fetchAllApplicants]);
    
    // Stratified sampling untuk distribusi yang lebih baik
    const performStratifiedSplit = (data, ratio) => {
        const acceptedApplicants = data.filter(app => app.status === 'Terima');
        const rejectedApplicants = data.filter(app => app.status === 'Tidak');
        
        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };
        
        const shuffledAccepted = shuffleArray(acceptedApplicants);
        const shuffledRejected = shuffleArray(rejectedApplicants);
        
        const acceptedSplitIndex = Math.floor(shuffledAccepted.length * ratio);
        const rejectedSplitIndex = Math.floor(shuffledRejected.length * ratio);
        
        const trainingAccepted = shuffledAccepted.slice(0, acceptedSplitIndex);
        const testingAccepted = shuffledAccepted.slice(acceptedSplitIndex);
        const trainingRejected = shuffledRejected.slice(0, rejectedSplitIndex);
        const testingRejected = shuffledRejected.slice(rejectedSplitIndex);
        
        return {
            training: shuffleArray([...trainingAccepted, ...trainingRejected]),
            testing: shuffleArray([...testingAccepted, ...testingRejected])
        };
    };

    // Fungsi yang dijalankan saat tombol "Bagi Data" di klik
    const handleSplitData = async () => {
        if (allApplicants.length === 0) {
            toast.warn('Tidak ada data pendaftar untuk dibagi.');
            return;
        }
        
        if (allApplicants.length < 10) {
            toast.warn('Data terlalu sedikit untuk dibagi. Minimal 10 data diperlukan.');
            return;
        }
        
        setIsSplitting(true);
        
        try {
            let newTrainingSet, newTestingSet;
            
            if (stratifiedSplit) {
                const { training, testing } = performStratifiedSplit(allApplicants, splitRatio);
                newTrainingSet = training;
                newTestingSet = testing;
            } else {
                // Random split
                const shuffled = [...allApplicants].sort(() => 0.5 - Math.random());
                const splitIndex = Math.floor(shuffled.length * splitRatio);
                newTrainingSet = shuffled.slice(0, splitIndex);
                newTestingSet = shuffled.slice(splitIndex);
            }
            
            setTrainingSet(newTrainingSet);
            setTestingSet(newTestingSet);
            
            // Simpan ke sessionStorage
            const trainingIds = newTrainingSet.map(app => app.id);
            const testingIds = newTestingSet.map(app => app.id);
            
            sessionStorage.setItem('trainingSetIds', JSON.stringify(trainingIds));
            sessionStorage.setItem('testingSetIds', JSON.stringify(testingIds));
            sessionStorage.setItem('splitRatio', splitRatio.toString());
            sessionStorage.setItem('splitMethod', stratifiedSplit ? 'stratified' : 'random');
            
            toast.success(`Data berhasil dibagi: ${newTrainingSet.length} data latih dan ${newTestingSet.length} data uji.`);
        } catch (error) {
            toast.error('Gagal membagi data: ' + error.message);
        } finally {
            setIsSplitting(false);
        }
    };

    // Export data to CSV
    const exportToCSV = (data, filename) => {
        const headers = ['ID', 'Nama', 'IPK', 'Penghasilan Ortu', 'Tanggungan', 'Organisasi', 'Status'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                row.id,
                `"${row.nama}"`,
                row.ipk,
                row.penghasilanOrtu,
                row.tanggungan,
                row.organisasi ? 'Ya' : 'Tidak',
                row.status
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    // Preview data modal
    const handlePreview = (type, data) => {
        setPreviewData({ type, data });
        setShowPreview(true);
    };

    // Calculate distribution statistics
    const getDistributionStats = (data) => {
        const accepted = data.filter(app => app.status === 'Terima').length;
        const rejected = data.filter(app => app.status === 'Tidak').length;
        const total = data.length;
        return {
            accepted,
            rejected,
            total,
            acceptanceRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0
        };
    };

    // Enhanced data card with statistics
    const renderDataCard = (data, title, variant) => {
        const stats = getDistributionStats(data);
        const isTraining = title.includes('Latih');
        
        return (
            <Card className="h-100 data-split-card">
                <Card.Header className={`bg-${variant} bg-opacity-10 data-card-header`}>
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-semibold">{title}</h6>
                        <Badge pill bg={variant}>{data.length}</Badge>
                    </div>
                </Card.Header>
                <Card.Body>
                    {data.length > 0 ? (
                        <>
                            {/* Distribution Stats */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <small className="text-muted">Distribusi Status</small>
                                    <small className="text-muted">{stats.acceptanceRate}% diterima</small>
                                </div>
                                <ProgressBar className="mb-2" style={{ height: '6px' }}>
                                    <ProgressBar variant="success" now={(stats.accepted / stats.total) * 100} />
                                    <ProgressBar variant="danger" now={(stats.rejected / stats.total) * 100} />
                                </ProgressBar>
                                <div className="d-flex justify-content-between">
                                    <small className="text-success">
                                        <CheckCircle size={12} className="me-1" />
                                        {stats.accepted} Diterima
                                    </small>
                                    <small className="text-danger">
                                        <XCircle size={12} className="me-1" />
                                        {stats.rejected} Ditolak
                                    </small>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <ButtonGroup className="w-100 mb-3 action-button-group" size="sm">
                                <Button 
                                    variant="outline-primary" 
                                    onClick={() => handlePreview(title, data)}
                                    className="export-button"
                                >
                                    <Eye size={14} className="me-1" /> Preview
                                </Button>
                                <Button 
                                    variant="outline-success" 
                                    onClick={() => exportToCSV(data, `${isTraining ? 'training' : 'testing'}_data.csv`)}
                                    className="export-button"
                                >
                                    <Download size={14} className="me-1" /> Export
                                </Button>
                            </ButtonGroup>
                            
                            {/* Sample Data Preview */}
                            <div className="table-responsive" style={{ maxHeight: '200px' }}>
                                <Table size="sm" className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Nama</th>
                                            <th>IPK</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.slice(0, 5).map(app => (
                                            <tr key={app.id}>
                                                <td className="text-truncate" style={{ maxWidth: '120px' }}>
                                                    {app.nama}
                                                </td>
                                                <td>{app.ipk}</td>
                                                <td>
                                                    <Badge 
                                                        bg={app.status === 'Terima' ? 'success' : 'danger'} 
                                                        className="fs-6"
                                                    >
                                                        {app.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {data.length > 5 && (
                                            <tr>
                                                <td colSpan="3" className="text-center text-muted">
                                                    ... dan {data.length - 5} data lainnya
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-muted py-4">
                            <InfoCircle size={24} className="mb-2" />
                            <p className="mb-0">Data akan muncul setelah pembagian</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
    };

    return (
        <Container fluid>
            <h1 className="h2 fw-bolder text-dark mb-4">Pembagian Data Latih & Uji</h1>

            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-gradient-primary text-white">
                    <h5 className="mb-0 d-flex align-items-center">
                        <FunnelFill className="me-2"/> Kontrol Pembagian Data
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col lg={8}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Rasio Pembagian: 
                                    <Badge bg="primary" className="ms-2">{Math.round(splitRatio * 100)}%</Badge> Data Latih / 
                                    <Badge bg="secondary" className="ms-1">{Math.round((1 - splitRatio) * 100)}%</Badge> Data Uji
                                </Form.Label>
                                <Form.Range 
                                    value={splitRatio}
                                    min="0.1"
                                    max="0.9"
                                    step="0.05"
                                    onChange={e => setSplitRatio(parseFloat(e.target.value))}
                                    className="mb-2"
                                />
                                <div className="d-flex justify-content-between text-muted small">
                                    <span>10%</span>
                                    <span>50%</span>
                                    <span>90%</span>
                                </div>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Check 
                                    type="switch"
                                    id="stratified-switch"
                                    label="Gunakan Stratified Sampling (Distribusi status seimbang)"
                                    checked={stratifiedSplit}
                                    onChange={e => setStratifiedSplit(e.target.checked)}
                                />
                                <Form.Text className="text-muted">
                                    Stratified sampling memastikan proporsi status 'Terima' dan 'Tidak' sama di kedua dataset
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        
                        <Col lg={4}>
                            <div className="stats-card">
                                <h6 className="fw-semibold mb-2">Informasi Dataset</h6>
                                <div className="mb-2">
                                    <small className="text-muted">Total Data:</small>
                                    <div className="fw-bold">{isLoading ? '...' : allApplicants.length.toLocaleString()}</div>
                                </div>
                                {!isLoading && allApplicants.length > 0 && (
                                    <>
                                        <div className="mb-2">
                                            <small className="text-muted">Estimasi Data Latih:</small>
                                            <div className="fw-bold text-primary">
                                                {Math.floor(allApplicants.length * splitRatio).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <small className="text-muted">Estimasi Data Uji:</small>
                                            <div className="fw-bold text-secondary">
                                                {Math.ceil(allApplicants.length * (1 - splitRatio)).toLocaleString()}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="d-grid mt-3">
                                <Button 
                                    variant="primary" 
                                    size="lg"
                                    onClick={handleSplitData} 
                                    disabled={isLoading || isSplitting || allApplicants.length === 0}
                                >
                                    {isSplitting ? (
                                        <>
                                            <Spinner as="span" size="sm" className="me-2"/> 
                                            Membagi Data...
                                        </>
                                    ) : (
                                        <>
                                            <Shuffle className="me-2"/> 
                                            Bagi Data
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
                
                {trainingSet.length > 0 && testingSet.length > 0 && (
                    <Card.Footer className="bg-success bg-opacity-10 split-success-animation">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <CheckCircle className="text-success me-2" />
                                <span className="fw-semibold">Data berhasil dibagi!</span>
                                <small className="text-muted ms-2">
                                    Siap untuk proses seleksi
                                </small>
                            </div>
                            <Button 
                                variant="success" 
                                onClick={() => navigate('/selection')}
                                className="d-flex align-items-center export-button"
                            >
                                Lanjut Seleksi <ClipboardData className="ms-2"/>
                            </Button>
                        </div>
                    </Card.Footer>
                )}
            </Card>

            {trainingSet.length === 0 && testingSet.length === 0 ? (
                <Alert variant="info" className="text-center info-panel">
                    <InfoCircle size={24} className="mb-2" />
                    <h6>Siap untuk Membagi Data</h6>
                    <p className="mb-0">Atur rasio pembagian dan klik tombol "Bagi Data" untuk memulai proses pembagian dataset.</p>
                </Alert>
            ) : (
                <Alert variant="success" className="d-flex align-items-center success-panel">
                    <CheckCircle className="me-2" />
                    <div>
                        <strong>Pembagian Data Berhasil!</strong>
                        <div className="small mt-1">
                            Metode: {stratifiedSplit ? 'Stratified Sampling' : 'Random Sampling'} | 
                            Rasio: {Math.round(splitRatio * 100)}% : {Math.round((1 - splitRatio) * 100)}%
                        </div>
                    </div>
                </Alert>
            )}

            <Row>
                <Col lg={6} className="mb-4">
                    {renderDataCard(trainingSet, 'Data Latih (Training Set)', 'primary')}
                </Col>
                <Col lg={6} className="mb-4">
                    {renderDataCard(testingSet, 'Data Uji (Testing Set)', 'secondary')}
                </Col>
            </Row>

            {/* Preview Modal */}
            <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{previewData.type} - Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="table-responsive" style={{ maxHeight: '400px' }}>
                        <Table striped hover>
                            <thead className="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Nama</th>
                                    <th>IPK</th>
                                    <th>Penghasilan</th>
                                    <th>Tanggungan</th>
                                    <th>Organisasi</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.data.map(app => (
                                    <tr key={app.id}>
                                        <td>{app.id}</td>
                                        <td>{app.nama}</td>
                                        <td>{app.ipk}</td>
                                        <td>{app.penghasilanOrtu?.toLocaleString()}</td>
                                        <td>{app.tanggungan}</td>
                                        <td>
                                            <Badge bg={app.organisasi ? 'success' : 'secondary'}>
                                                {app.organisasi ? 'Ya' : 'Tidak'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge bg={app.status === 'Terima' ? 'success' : 'danger'}>
                                                {app.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPreview(false)}>
                        Tutup
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => {
                            const isTraining = previewData.type.includes('Latih');
                            exportToCSV(previewData.data, `${isTraining ? 'training' : 'testing'}_data.csv`);
                        }}
                    >
                        <Download className="me-1" /> Export CSV
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default DataSplittingPage;