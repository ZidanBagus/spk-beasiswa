// src/pages/SimulasiC45Page.jsx
import React, { useState } from 'react';
import { Container, Card, Row, Col, Button, Form, Spinner, Alert, Tabs, Tab, Table } from 'react-bootstrap';
import { Cpu, Binoculars, Diagram3, Pen } from 'react-bootstrap-icons';
import selectionService from '../services/selectionService';
import { toast } from 'react-toastify';

const SimulasiC45Page = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [modelData, setModelData] = useState(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        ipk: 3.5,
        penghasilanOrtu: 'Rendah',
        jmlTanggungan: 2,
        ikutOrganisasi: 'Ya',
        ikutUKM: 'Ya'
    });
    const [predictionResult, setPredictionResult] = useState(null);

    const fetchTreeData = async () => {
        setIsLoading(true);
        setError('');
        setPredictionResult(null);
        setModelData(null);
        try {
            const data = await selectionService.getTreeVisualization();
            setModelData(data);
            toast.success("Data pohon keputusan berhasil dimuat!");
        } catch (err) {
            const message = err.message || "Gagal memuat data. Latih model terlebih dahulu di halaman 'Proses Seleksi'.";
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Memprediksi...");
        try {
            const dataToSend = {
                ...formData,
                ipk: parseFloat(formData.ipk),
                jmlTanggungan: parseInt(formData.jmlTanggungan)
            };
            const result = await selectionService.predictSingle(dataToSend);
            setPredictionResult(result);
            toast.update(toastId, { render: "Prediksi berhasil!", type: 'success', autoClose: 2000, isLoading: false });
        } catch (err) {
            toast.update(toastId, { render: err.message || "Gagal melakukan prediksi.", type: 'error', autoClose: 4000, isLoading: false });
        }
    };
    
    return (
        <Container fluid>
            <h1 className="h2 fw-bolder text-dark mb-4">Simulasi & Visualisasi C4.5</h1>
            
            <Card className="shadow-sm">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0"><Binoculars className="me-2"/>Intip Cara Kerja Model</h5>
                        <Button onClick={fetchTreeData} disabled={isLoading}>
                           {isLoading ? <Spinner size="sm" /> : <Cpu className="me-2"/>} Muat Pohon & Langkah Hitung
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {!modelData && !isLoading && (
                        <Alert variant="info">
                            Klik tombol "Muat Pohon Keputusan" untuk melihat visualisasi model yang terakhir kali Anda latih di halaman 'Proses Seleksi'.
                        </Alert>
                    )}
                    {isLoading && <div className="text-center p-5"><Spinner animation="border" variant="primary"/></div>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {modelData && (
                        <Tabs defaultActiveKey="visualisasi" id="simulasi-tabs" className="mb-3" justify>
                            <Tab eventKey="visualisasi" title={<><Diagram3 className="me-2"/> Visualisasi Pohon</>}>
                                <Card.Text as="pre" className="bg-light p-3 rounded"><code>{modelData.visualization}</code></Card.Text>
                            </Tab>
                            <Tab eventKey="perhitungan" title="Langkah Perhitungan">
                                {modelData.steps.map((step, index) => (
                                    <Card key={index} className="mb-3">
                                        <Card.Header><strong>Node {index + 1}</strong> | Atribut Terbaik: <strong className="text-success">{step.bestAttribute || 'N/A'}</strong></Card.Header>
                                        <Card.Body>
                                            <p>Ukuran Data: {step.dataSize} | Entropy: {step.entropy.toFixed(4)}</p>
                                            <Table striped bordered size="sm">
                                                <thead><tr><th>Atribut</th><th>Gain Ratio</th></tr></thead>
                                                <tbody>
                                                    {Object.entries(step.calculations).sort(([,a],[,b]) => b.gainRatio - a.gainRatio).map(([attr, calcs]) => 
                                                        <tr key={attr}>
                                                            <td>{attr.replace('_kategori', '')}</td>
                                                            <td>{calcs.gainRatio.toFixed(4)}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </Tab>
                             <Tab eventKey="prediksi" title={<><Pen className="me-2"/> Uji Coba Prediksi</>}>
                                <Form onSubmit={handlePredict}>
                                    <Row>
                                        <Col md={4}><Form.Group className="mb-3"><Form.Label>IPK</Form.Label><Form.Control type="number" name="ipk" value={formData.ipk} onChange={handleInputChange} step="0.01" required /></Form.Group></Col>
                                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Jumlah Tanggungan</Form.Label><Form.Control type="number" name="jmlTanggungan" value={formData.jmlTanggungan} onChange={handleInputChange} required /></Form.Group></Col>
                                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Penghasilan Ortu</Form.Label><Form.Select name="penghasilanOrtu" value={formData.penghasilanOrtu} onChange={handleInputChange}><option>Rendah</option><option>Sedang</option><option>Tinggi</option></Form.Select></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Ikut Organisasi</Form.Label><Form.Select name="ikutOrganisasi" value={formData.ikutOrganisasi} onChange={handleInputChange}><option>Ya</option><option>Tidak</option></Form.Select></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Ikut UKM</Form.Label><Form.Select name="ikutUKM" value={formData.ikutUKM} onChange={handleInputChange}><option>Ya</option><option>Tidak</option></Form.Select></Form.Group></Col>
                                    </Row>
                                    <Button type="submit">Prediksi</Button>
                                </Form>
                                {predictionResult && (
                                    <Alert variant={predictionResult.decision === 'Direkomendasikan' ? 'success' : 'danger'} className="mt-4">
                                        <Alert.Heading>Hasil Prediksi: {predictionResult.decision}</Alert.Heading>
                                        <hr/>
                                        <p className="mb-0">
                                            Jalur Keputusan: {predictionResult.path.filter(p => p.attribute).map(p => `${p.attribute.replace('_kategori','')} = '${p.value}'`).join(' → ')}
                                        </p>
                                    </Alert>
                                )}
                            </Tab>
                        </Tabs>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SimulasiC45Page;
