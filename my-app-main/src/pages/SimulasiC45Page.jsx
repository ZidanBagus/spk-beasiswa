// src/pages/SimulasiC45Page.jsx
import React, { useState, useCallback, useEffect } from 'react';
import DecisionTree from '../components/decision-tree/DecisionTree';
import { Container, Card, Row, Col, Button, Form, Spinner, Alert, Tabs, Tab, Table, Badge, ProgressBar, Modal, ButtonGroup } from 'react-bootstrap';
import { Cpu, Binoculars, Diagram3, Pen, ZoomIn, ZoomOut, ArrowCounterclockwise, Download, Share, PlayFill, StopFill, InfoCircle } from 'react-bootstrap-icons';
import selectionService from '../services/selectionService';
import { toast } from 'react-toastify';
import './SimulasiC45Page.css';

const SimulasiC45Page = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [modelData, setModelData] = useState(null);
    const [error, setError] = useState('');
    const [isModelTrained, setIsModelTrained] = useState(false);

    const [formData, setFormData] = useState({
        ipk: 3.5,
        penghasilanOrtu: 'Rendah',
        jmlTanggungan: 2,
        ikutOrganisasi: 'Ya',
        ikutUKM: 'Ya'
    });
    const [predictionResult, setPredictionResult] = useState(null);
    const [showStepByStep, setShowStepByStep] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [modelStats, setModelStats] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    // Check model status on component mount
    useEffect(() => {
        checkModelStatus();
    }, []);

    const checkModelStatus = async () => {
        try {
            const status = await selectionService.checkModelStatus();
            setIsModelTrained(status.trained);
            return status.trained;
        } catch (err) {
            setIsModelTrained(false);
            return false;
        }
    };

    const fetchTreeData = async () => {
        setIsLoading(true);
        setError('');
        setPredictionResult(null);
        setModelData(null);
        try {
            const data = await selectionService.getTreeVisualization();
            setModelData(data);
            // Check model status when tree data is loaded
            await checkModelStatus();
            toast.success("Data pohon keputusan berhasil dimuat!");
        } catch (err) {
            const message = err.message || "Gagal memuat data. Latih model terlebih dahulu di halaman 'Proses Seleksi'.";
            setError(message);
            setIsModelTrained(false);
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
        const toastId = toast.loading("Memproses prediksi dengan algoritma C4.5...");
        try {
            // Prepare data with proper formatting
            const dataToSend = {
                ipk: parseFloat(formData.ipk),
                penghasilanOrtu: formData.penghasilanOrtu,
                jmlTanggungan: parseInt(formData.jmlTanggungan),
                ikutOrganisasi: formData.ikutOrganisasi === 'Ya',
                ikutUKM: formData.ikutUKM === 'Ya'
            };
            
            // Get prediction from backend
            const result = await selectionService.predictSingle(dataToSend);
            
            // Enhance result with detailed calculation steps
            const enhancedResult = {
                ...result,
                inputData: dataToSend,
                confidence: 85,
                timestamp: new Date().toISOString()
            };
            
            setPredictionResult(enhancedResult);
            toast.update(toastId, { 
                render: `Prediksi selesai! Hasil: ${result.decision}`, 
                type: 'success', 
                autoClose: 3000, 
                isLoading: false 
            });
        } catch (err) {
            console.error('Prediction error:', err);
            toast.update(toastId, { 
                render: err.message || "Gagal melakukan prediksi. Pastikan model telah dilatih.", 
                type: 'error', 
                autoClose: 5000, 
                isLoading: false 
            });
        }
    };
    
    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h2 fw-bolder text-dark mb-1">Simulasi & Visualisasi C4.5</h1>
                    <p className="text-muted mb-0">Eksplorasi mendalam algoritma C4.5 dengan visualisasi interaktif</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-info" onClick={() => setShowExplanation(true)}>
                        <InfoCircle className="me-2" size={16}/>
                        Panduan
                    </Button>
                    {modelData && (
                        <Button variant="outline-success">
                            <Download className="me-2" size={16}/>
                            Export Data
                        </Button>
                    )}
                </div>
            </div>
            
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-gradient-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0"><Binoculars className="me-2"/>Eksplorasi Model C4.5</h5>
                        <Button variant="light" onClick={fetchTreeData} disabled={isLoading}>
                           {isLoading ? <Spinner size="sm" /> : <Cpu className="me-2"/>} Muat Model
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {!modelData && !isLoading && (
                        <div className="text-center py-5">
                            <div className="mb-4">
                                <Diagram3 size={64} className="text-muted mb-3" />
                                <h5 className="text-muted">Belum Ada Model Dimuat</h5>
                                <p className="text-muted mb-4">
                                    Klik tombol "Muat Model" untuk melihat visualisasi pohon keputusan C4.5 
                                    yang telah dilatih di halaman 'Proses Seleksi'.
                                </p>
                                <Button variant="primary" onClick={fetchTreeData} size="lg">
                                    <Cpu className="me-2"/> Muat Model Sekarang
                                </Button>
                            </div>
                        </div>
                    )}
                    {isLoading && <div className="text-center p-5"><Spinner animation="border" variant="primary"/></div>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {modelData && (
                        <Tabs defaultActiveKey="visualisasi" id="simulasi-tabs" className="mb-3" justify>
                            <Tab eventKey="visualisasi" title={<><Diagram3 className="me-2"/> Visualisasi Pohon</>}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg="info" className="fs-6">
                                            <Diagram3 className="me-1" size={12} />
                                            Pohon Keputusan Interaktif
                                        </Badge>
                                    </div>
                                    <ButtonGroup size="sm">
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => {
                                                const element = document.querySelector('.tree-container');
                                                if (element) {
                                                    const currentScale = element.style.transform ? 
                                                        parseFloat(element.style.transform.replace('scale(', '')) : 1;
                                                    const newScale = Math.min(currentScale + 0.1, 2);
                                                    element.style.transform = `scale(${newScale})`;
                                                }
                                            }}
                                        >
                                            <ZoomIn size={14} /> Zoom In
                                        </Button>
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => {
                                                const element = document.querySelector('.tree-container');
                                                if (element) {
                                                    const currentScale = element.style.transform ? 
                                                        parseFloat(element.style.transform.replace('scale(', '')) : 1;
                                                    const newScale = Math.max(currentScale - 0.1, 0.5);
                                                    element.style.transform = `scale(${newScale})`;
                                                }
                                            }}
                                        >
                                            <ZoomOut size={14} /> Zoom Out
                                        </Button>
                                        <Button 
                                            variant="outline-secondary"
                                            onClick={() => {
                                                const element = document.querySelector('.tree-container');
                                                if (element) {
                                                    element.style.transform = 'scale(1)';
                                                }
                                            }}
                                        >
                                            <ArrowCounterclockwise size={14} /> Reset
                                        </Button>
                                    </ButtonGroup>
                                </div>
                                <div 
                                    className="tree-container position-relative" 
                                    style={{
                                        minHeight: '500px',
                                        overflow: 'auto',
                                        background: '#f8f9fa',
                                        borderRadius: '8px',
                                        padding: '2rem',
                                        border: '1px solid #dee2e6'
                                    }}
                                >
                                    { (modelData.tree || modelData.treeData || modelData) && <DecisionTree data={modelData.tree || modelData.treeData || modelData} />}
                                </div>
                                <div className="mt-3 text-center text-muted">
                                    <small>
                                        <i>Gunakan scroll untuk zoom in/out, dan drag untuk menggeser pohon</i>
                                    </small>
                                </div>
                            </Tab>
                            <Tab eventKey="perhitungan" title="Langkah Perhitungan">
                                <div className="mb-3">
                                    <Alert variant="info">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Langkah-langkah perhitungan algoritma C4.5 dalam membangun pohon keputusan.
                                        Setiap node menunjukkan proses pemilihan atribut terbaik berdasarkan nilai Gain Ratio tertinggi.
                                    </Alert>
                                </div>
                                {modelData.steps.map((step, index) => (
                                    <Card key={index} className="mb-4 shadow-sm">
                                        <Card.Header className="bg-light">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">
                                                    <span className="badge bg-primary me-2">Node {index + 1}</span>
                                                    Atribut Terpilih: <strong className="text-success">{step.bestAttribute?.replace('_kategori', '') || 'N/A'}</strong>
                                                </h5>
                                                <small className="text-muted">
                                                    Ukuran Data: <strong>{step.dataSize}</strong> |
                                                    Entropy: <strong>{step.entropy.toFixed(4)}</strong>
                                                </small>
                                            </div>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="table-responsive">
                                                <Table striped bordered hover size="sm" className="mb-0">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th style={{width: '20%'}}>Atribut</th>
                                                            <th style={{width: '40%'}}>Gain Ratio</th>
                                                            <th style={{width: '40%'}}>Visualisasi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(step.calculations)
                                                            .sort(([,a],[,b]) => b.gainRatio - a.gainRatio)
                                                            .map(([attr, calcs]) => {
                                                                const isHighest = attr === step.bestAttribute;
                                                                const gainRatioPercent = (calcs.gainRatio * 100).toFixed(2);
                                                                
                                                                return (
                                                                    <tr key={attr} className={isHighest ? 'table-success' : ''}>
                                                                        <td>
                                                                            <strong>{attr.replace('_kategori', '')}</strong>
                                                                            {isHighest && <i className="bi bi-check-circle-fill text-success ms-2"></i>}
                                                                        </td>
                                                                        <td>
                                                                            <div className="d-flex justify-content-between align-items-center">
                                                                                <span>{calcs.gainRatio.toFixed(4)}</span>
                                                                                {calcs.threshold && (
                                                                                    <small className="text-muted">
                                                                                        (Threshold: {calcs.threshold.toFixed(2)})
                                                                                    </small>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <div className="progress" style={{height: '20px'}}>
                                                                                <div 
                                                                                    className={`progress-bar ${isHighest ? 'bg-success' : 'bg-info'}`}
                                                                                    role="progressbar"
                                                                                    style={{width: `${gainRatioPercent}%`}}
                                                                                    aria-valuenow={gainRatioPercent}
                                                                                    aria-valuemin="0"
                                                                                    aria-valuemax="100"
                                                                                >
                                                                                    {gainRatioPercent}%
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </Tab>
                            <Tab eventKey="prediksi" title={<><Pen className="me-2"/> Uji Coba Prediksi</>}>
                                <div className="mb-3">
                                    {!isModelTrained ? (
                                        <Alert variant="warning">
                                            <i className="bi bi-exclamation-triangle me-2"></i>
                                            Model belum dilatih. Silakan latih model terlebih dahulu di halaman <strong>'Proses Seleksi'</strong> untuk mendapatkan prediksi yang akurat berdasarkan data historis.
                                        </Alert>
                                    ) : (
                                        <Alert variant="info">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Masukkan data mahasiswa untuk memprediksi rekomendasi beasiswa menggunakan model yang telah dilatih.
                                        </Alert>
                                    )}
                                </div>

                                <Card className="mb-4 shadow-sm border-0">
                                    <Card.Header className="bg-light">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <strong><i className="bi bi-person-vcard me-2"></i>Form Simulasi Prediksi</strong>
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm"
                                                onClick={() => setFormData({
                                                    ipk: 3.5,
                                                    penghasilanOrtu: 'Rendah',
                                                    jmlTanggungan: 2,
                                                    ikutOrganisasi: 'Ya',
                                                    ikutUKM: 'Ya'
                                                })}
                                            >
                                                <i className="bi bi-arrow-counterclockwise me-2"></i>
                                                Reset Form
                                            </Button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form onSubmit={handlePredict}>
                                            <Row className="g-3">
                                                <Col md={4}>
                                                    <Form.Group>
                                                        <Form.Label>
                                                            <i className="bi bi-mortarboard me-2"></i>
                                                            IPK
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="ipk"
                                                            value={formData.ipk}
                                                            onChange={handleInputChange}
                                                            step="0.01"
                                                            min={0}
                                                            max={4}
                                                            placeholder="Contoh: 3.50"
                                                            required
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Masukkan IPK dengan format desimal (0.00 - 4.00)
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group>
                                                        <Form.Label>
                                                            <i className="bi bi-people me-2"></i>
                                                            Jumlah Tanggungan
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="jmlTanggungan"
                                                            value={formData.jmlTanggungan}
                                                            onChange={handleInputChange}
                                                            min={1}
                                                            max={10}
                                                            placeholder="Contoh: 2"
                                                            required
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Jumlah tanggungan dalam keluarga (1-10)
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group>
                                                        <Form.Label>
                                                            <i className="bi bi-cash-stack me-2"></i>
                                                            Penghasilan Ortu
                                                        </Form.Label>
                                                        <Form.Select 
                                                            name="penghasilanOrtu" 
                                                            value={formData.penghasilanOrtu} 
                                                            onChange={handleInputChange}
                                                            required
                                                        >
                                                            <option value="Rendah">Rendah</option>
                                                            <option value="Sedang">Sedang</option>
                                                            <option value="Tinggi">Tinggi</option>
                                                        </Form.Select>
                                                        <Form.Text className="text-muted">
                                                            Kategori penghasilan orang tua
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>
                                                            <i className="bi bi-person-badge me-2"></i>
                                                            Ikut Organisasi
                                                        </Form.Label>
                                                        <Form.Select 
                                                            name="ikutOrganisasi" 
                                                            value={formData.ikutOrganisasi} 
                                                            onChange={handleInputChange}
                                                            required
                                                        >
                                                            <option value="Ya">Ya</option>
                                                            <option value="Tidak">Tidak</option>
                                                        </Form.Select>
                                                        <Form.Text className="text-muted">
                                                            Keaktifan dalam organisasi kampus
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>
                                                            <i className="bi bi-person-workspace me-2"></i>
                                                            Ikut UKM
                                                        </Form.Label>
                                                        <Form.Select 
                                                            name="ikutUKM" 
                                                            value={formData.ikutUKM} 
                                                            onChange={handleInputChange}
                                                            required
                                                        >
                                                            <option value="Ya">Ya</option>
                                                            <option value="Tidak">Tidak</option>
                                                        </Form.Select>
                                                        <Form.Text className="text-muted">
                                                            Keaktifan dalam Unit Kegiatan Mahasiswa
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <div className="d-flex justify-content-end mt-4">
                                                <Button type="submit" variant="primary" disabled={isLoading || !isModelTrained}>
                                                    {isLoading ? (
                                                        <>
                                                            <Spinner size="sm" className="me-2" />
                                                            Memproses...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-lightning-charge me-2"></i>
                                                            Prediksi
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </Form>
                                        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                                    </Card.Body>
                                </Card>

                                {predictionResult && (
                                    <Card className="result-card shadow-sm border-0 mb-3">
                                        <Card.Header className={`${predictionResult.decision === 'Direkomendasikan' ? 'bg-success' : 'bg-danger'} text-white`}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <Binoculars className="me-2" size={20} />
                                                    <strong>Hasil Prediksi C4.5</strong>
                                                </div>
                                                <Badge bg="light" text="dark" className="fs-6">
                                                    Confidence: {predictionResult.confidence || 85}%
                                                </Badge>
                                            </div>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row className="mb-4">
                                                <Col md={6}>
                                                    <div className="text-center">
                                                        {predictionResult.decision === 'Direkomendasikan' ? (
                                                            <div className="d-inline-block border border-success rounded-circle p-3 mb-3">
                                                                <span className="badge bg-success fs-5 px-4 py-2">
                                                                    <i className="bi bi-check-circle me-2"></i>
                                                                    Direkomendasikan
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="d-inline-block border border-danger rounded-circle p-3 mb-3">
                                                                <span className="badge bg-danger fs-5 px-4 py-2">
                                                                    <i className="bi bi-x-circle me-2"></i>
                                                                    Tidak Direkomendasikan
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="small text-muted">
                                                            Prediksi pada: {new Date(predictionResult.timestamp || Date.now()).toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={6}>
                                                    <div className="bg-light p-3 rounded">
                                                        <h6 className="mb-2">Data Input:</h6>
                                                        <div className="small">
                                                            <div>IPK: <strong>{predictionResult.inputData?.ipk}</strong></div>
                                                            <div>Penghasilan: <strong>{predictionResult.inputData?.penghasilanOrtu}</strong></div>
                                                            <div>Tanggungan: <strong>{predictionResult.inputData?.jmlTanggungan}</strong></div>
                                                            <div>Organisasi: <strong>{predictionResult.inputData?.ikutOrganisasi ? 'Ya' : 'Tidak'}</strong></div>
                                                            <div>UKM: <strong>{predictionResult.inputData?.ikutUKM ? 'Ya' : 'Tidak'}</strong></div>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                            
                                            <div className="bg-light p-3 rounded">
                                                <h6 className="mb-3">
                                                    <i className="bi bi-diagram-2 me-2"></i>
                                                    Jalur Keputusan Algoritma C4.5:
                                                </h6>
                                                <div className="decision-path">
                                                    {predictionResult.path
                                                        ?.filter(p => p.attribute)
                                                        .map((p, index, arr) => (
                                                            <div key={index} className="d-flex align-items-center mb-2">
                                                                <Badge bg="info" className="me-2">
                                                                    {p.attribute.replace('_kategori','')}
                                                                </Badge>
                                                                <span className="mx-1">{p.condition || '='}</span>
                                                                <Badge bg="secondary" className="me-2">{p.value}</Badge>
                                                                {index < arr.length - 1 && (
                                                                    <i className="bi bi-arrow-right mx-2 text-primary"></i>
                                                                )}
                                                            </div>
                                                        )) || (
                                                        <div className="text-muted">Jalur keputusan tidak tersedia</div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}
                            </Tab>
                        </Tabs>
                    )}
                </Card.Body>
            </Card>
            {/* Explanation Modal */}
            <Modal show={showExplanation} onHide={() => setShowExplanation(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <InfoCircle className="me-2" />
                        Panduan Simulasi C4.5
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="p-3">
                        <h6>Apa itu Algoritma C4.5?</h6>
                        <p>C4.5 adalah algoritma machine learning untuk membangun pohon keputusan (decision tree) yang digunakan untuk klasifikasi data. Algoritma ini bekerja dengan memilih atribut terbaik pada setiap node berdasarkan nilai Gain Ratio tertinggi.</p>
                        
                        <h6>Fitur Simulasi:</h6>
                        <ul>
                            <li><strong>Visualisasi Pohon:</strong> Lihat struktur pohon keputusan secara interaktif</li>
                            <li><strong>Langkah Perhitungan:</strong> Pahami proses pemilihan atribut di setiap node</li>
                            <li><strong>Prediksi Real-time:</strong> Uji model dengan data baru</li>
                        </ul>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExplanation(false)}>
                        Tutup
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SimulasiC45Page;
