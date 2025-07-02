// src/pages/DataSplittingPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Form, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import { FunnelFill, ClipboardData } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import applicantService from '../services/applicantService';
import { toast } from 'react-toastify';

const DataSplittingPage = () => {
    const [allApplicants, setAllApplicants] = useState([]);
    const [trainingSet, setTrainingSet] = useState([]);
    const [testingSet, setTestingSet] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [splitRatio, setSplitRatio] = useState(0.7); // Default 70% untuk data latih
    
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
    
    // Fungsi yang dijalankan saat tombol "Bagi Data" di klik
    const handleSplitData = () => {
        if (allApplicants.length === 0) {
            toast.warn('Tidak ada data pendaftar untuk dibagi.');
            return;
        }
        
        // 1. Acak urutan array agar pembagian data bersifat random
        const shuffled = [...allApplicants].sort(() => 0.5 - Math.random());
        
        // 2. Tentukan titik potong berdasarkan rasio
        const splitIndex = Math.floor(shuffled.length * splitRatio);
        
        const newTrainingSet = shuffled.slice(0, splitIndex);
        const newTestingSet = shuffled.slice(splitIndex);
        
        setTrainingSet(newTrainingSet);
        setTestingSet(newTestingSet);
        
        // 3. Simpan hanya ID ke sessionStorage untuk digunakan oleh halaman lain
        const trainingIds = newTrainingSet.map(app => app.id);
        const testingIds = newTestingSet.map(app => app.id);
        
        sessionStorage.setItem('trainingSetIds', JSON.stringify(trainingIds));
        sessionStorage.setItem('testingSetIds', JSON.stringify(testingIds));
        
        toast.success(`Data berhasil dibagi: ${newTrainingSet.length} data latih dan ${newTestingSet.length} data uji.`);
    };

    // Komponen kecil untuk menampilkan tabel data
    const renderApplicantTable = (data, title) => (
        <Card>
            <Card.Header as="h6" className="fw-semibold">{title} <Badge pill bg="primary">{data.length}</Badge></Card.Header>
            <div className="table-responsive" style={{ maxHeight: '400px', minHeight: '200px' }}>
                <Table striped bordered hover size="sm" className="mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Nama</th>
                            <th>IPK</th>
                            <th>Penghasilan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(app => (
                            <tr key={app.id}>
                                <td>{app.id}</td>
                                <td>{app.nama}</td>
                                <td>{app.ipk}</td>
                                <td>{app.penghasilanOrtu}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted py-5">Data akan muncul di sini setelah dibagi.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );

    return (
        <Container fluid>
            <h1 className="h2 fw-bolder text-dark mb-4">Pembagian Data Latih & Uji</h1>

            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                    <h5 className="mb-0 d-flex align-items-center"><FunnelFill className="me-2"/> Kontrol Pembagian Data</h5>
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6} lg={8}>
                            <Form.Group>
                                <Form.Label>
                                    Rasio Pembagian (Data Latih: <strong>{Math.round(splitRatio * 100)}%</strong> / Data Uji: <strong>{Math.round((1 - splitRatio) * 100)}%</strong>)
                                </Form.Label>
                                <Form.Range 
                                    value={splitRatio}
                                    min="0.1"
                                    max="0.9"
                                    step="0.05"
                                    onChange={e => setSplitRatio(parseFloat(e.target.value))}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6} lg={4} className="mt-3 mt-md-0">
                            <div className="d-grid">
                                <Button onClick={handleSplitData} disabled={isLoading}>
                                    {isLoading ? <Spinner as="span" size="sm" className="me-2"/> : <ClipboardData className="me-2"/>} 
                                    Bagi Data & Lanjut ke Proses Seleksi
                                </Button>
                                <Form.Text className="text-center mt-2">
                                    Total data tersedia: <strong>{isLoading ? '...' : allApplicants.length}</strong>
                                </Form.Text>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
                {/* Tambahkan tombol "Lanjut Seleksi" di luar Form.Group */}
                {trainingSet.length > 0 && testingSet.length > 0 && <Card.Footer className="text-end"><Button variant="primary" onClick={() => navigate('/selection')}>Lanjut Seleksi <ClipboardData className="ms-2"/></Button></Card.Footer>}
            </Card>

            <Alert variant="info">
                Hasil pembagian data akan ditampilkan di bawah ini.
            </Alert>

            <Row>
                <Col md={6} className="mb-3">
                    {renderApplicantTable(trainingSet, 'Data Latih (Training Set)')}
                </Col>
                <Col md={6} className="mb-3">
                    {renderApplicantTable(testingSet, 'Data Uji (Testing Set)')}
                </Col>
            </Row>
        </Container>
    );
};

export default DataSplittingPage;