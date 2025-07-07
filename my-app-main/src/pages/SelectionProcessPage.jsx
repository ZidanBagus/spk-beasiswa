import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert, Badge, Accordion, ProgressBar, Modal, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Cpu, Clipboard2Check, Globe, ArrowCounterclockwise, InfoCircle, CheckCircle, PlayFill, StopFill, Eye, Download, Share, Clock } from 'react-bootstrap-icons';
import selectionService from '../services/selectionService';
import { useAttributes } from '../contexts/AttributeContext';
import { toast } from 'react-toastify';
import ProcessStepper from '../components/selection/ProcessStepper';
import TreeVisualization from '../components/selection/TreeVisualization';
import EvaluationResults from '../components/selection/EvaluationResults';
import './SelectionProcessPage.css';
import '../components/dashboard/animations.css';
import '../components/dashboard/pulse-animation.css';
import useScrollAnimation from '../hooks/useScrollAnimation';

const PROCESS_STEPS = ['Persiapan Data', 'Latih Model', 'Uji Model', 'Terapkan Model'];

const SelectionProcessPage = () => {
    const [trainingIds, setTrainingIds] = useState([]);
    const [testingIds, setTestingIds] = useState([]);
    const [isDataReady, setIsDataReady] = useState(false);
    const [isModelTrained, setIsModelTrained] = useState(false);
    const [evaluationResults, setEvaluationResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [modelStatus, setModelStatus] = useState(null);
    const [processProgress, setProcessProgress] = useState(0);
    const [showProgress, setShowProgress] = useState(false);
    const [progressSteps, setProgressSteps] = useState([]);
    const [showModelInfo, setShowModelInfo] = useState(false);
    const [processingTime, setProcessingTime] = useState(null);
    const [startTime, setStartTime] = useState(null);

    const { attributes: selectedAttributesList } = useAttributes();

    // Scroll animations
    const [stepperRef, stepperVisible] = useScrollAnimation({ threshold: 0.2 });
    const [statsRef, statsVisible] = useScrollAnimation({ threshold: 0.1 });
    const [actionsRef, actionsVisible] = useScrollAnimation({ threshold: 0.1 });
    const [resultsRef, resultsVisible] = useScrollAnimation({ threshold: 0.1 });

    useEffect(() => {
        const storedTrainingIds = JSON.parse(sessionStorage.getItem('trainingSetIds'));
        const storedTestingIds = JSON.parse(sessionStorage.getItem('testingSetIds'));
        if (storedTrainingIds && storedTestingIds) {
            setTrainingIds(storedTrainingIds);
            setTestingIds(storedTestingIds);
            setIsDataReady(true);
            setCurrentStep(1);
        }
        
        // Check model status on component mount
        checkModelStatus();
    }, []);

    const checkModelStatus = async () => {
        try {
            const status = await selectionService.checkModelStatus();
            setModelStatus(status);
            if (status.isTrained) {
                setIsModelTrained(true);
                setCurrentStep(2);
            }
        } catch (error) {
            // Model status check failed, continue with default state
            console.log('Model status check failed:', error.message);
        }
    };

    const resetModel = async () => {
        if (!window.confirm('Apakah Anda yakin ingin mereset model? Semua progress akan hilang.')) {
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Mereset model...");

        try {
            await selectionService.resetModel();
            setIsModelTrained(false);
            setEvaluationResults(null);
            setCurrentStep(1);
            toast.update(toastId, { 
                render: "Model berhasil direset", 
                type: 'success', 
                isLoading: false, 
                autoClose: 3000 
            });
        } catch (error) {
            toast.update(toastId, { 
                render: error.message || "Gagal mereset model", 
                type: 'error', 
                isLoading: false, 
                autoClose: 5000 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const simulateProgress = (duration, steps) => {
        setShowProgress(true);
        setProcessProgress(0);
        setProgressSteps(steps);
        setStartTime(Date.now());
        
        const interval = setInterval(() => {
            setProcessProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setShowProgress(false);
                    return 100;
                }
                return prev + (100 / (duration / 100));
            });
        }, 100);
    };

    const handleTrainModel = async () => {
        setIsLoading(true);
        setCurrentAction('train');
        setEvaluationResults(null);
        setIsModelTrained(false);
        
        const selectedAttributeNames = selectedAttributesList.filter(attr => attr.isSelected).map(attr => attr.attributeName);
            
        if (selectedAttributeNames.length < 2) {
            toast.error("Gagal! Harap pilih setidaknya 2 atribut di halaman Pengaturan Atribut.");
            setIsLoading(false);
            setCurrentAction(null);
            return;
        }

        // Start progress simulation
        simulateProgress(5000, [
            'Mempersiapkan data latih...',
            'Menghitung entropy dan gain ratio...',
            'Membangun pohon keputusan...',
            'Optimasi model...',
            'Finalisasi model...'
        ]);

        const toastId = toast.loading("Melatih model C4.5 dengan algoritma terbaru...");
        const startTime = Date.now();

        try {
            const response = await selectionService.trainModel(trainingIds, selectedAttributeNames);
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            
            setProcessingTime(duration);
            setIsModelTrained(true);
            setCurrentStep(2);
            
            toast.update(toastId, { 
                render: `Model berhasil dilatih dalam ${duration} detik!`, 
                type: 'success', 
                isLoading: false, 
                autoClose: 3000 
            });
            
            // Update model status
            await checkModelStatus();
        } catch (error) {
            toast.update(toastId, { 
                render: error.message || "Gagal melatih model.", 
                type: 'error', 
                isLoading: false, 
                autoClose: 5000 
            });
        } finally {
            setIsLoading(false);
            setCurrentAction(null);
            setShowProgress(false);
        }
    };

    const handleTestModel = async (mode = 'test') => {
        setIsLoading(true);
        setCurrentAction(mode);
        
        const steps = mode === 'test' 
            ? ['Mempersiapkan data uji...', 'Menjalankan prediksi...', 'Menghitung metrik evaluasi...', 'Membuat confusion matrix...', 'Finalisasi hasil...']
            : ['Mempersiapkan seluruh dataset...', 'Menjalankan prediksi batch...', 'Menyimpan hasil...', 'Membuat laporan...', 'Selesai...'];
            
        simulateProgress(4000, steps);
        
        const actionText = mode === 'test' ? "Menguji model dengan data uji..." : "Menerapkan model pada seluruh data...";
        const toastId = toast.loading(actionText);
        const startTime = Date.now();

        try {
            const response = mode === 'test' 
                ? await selectionService.testModel(testingIds)
                : await selectionService.testModelOnAllData();
            
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            
            setEvaluationResults(response.evaluation);
            setCurrentStep(mode === 'test' ? 3 : 4);
            
            toast.update(toastId, { 
                render: `${mode === 'test' ? 'Pengujian' : 'Penerapan'} berhasil dalam ${duration} detik!`, 
                type: 'success', 
                isLoading: false, 
                autoClose: 3000 
            });
        } catch (error) {
            toast.update(toastId, { 
                render: error.message || "Gagal melakukan pengujian.", 
                type: 'error', 
                isLoading: false, 
                autoClose: 5000 
            });
        } finally {
            setIsLoading(false);
            setCurrentAction(null);
            setShowProgress(false);
        }
    };
    
    if (!isDataReady) {
        return (
            <Container fluid>
                <Alert variant="warning" className="mt-4">
                    <Alert.Heading className="d-flex align-items-center">
                        <InfoCircle className="me-2" />
                        Data Belum Dibagi
                    </Alert.Heading>
                    <p>Data latih dan data uji tidak ditemukan. Silakan bagi data terlebih dahulu di halaman <Alert.Link as={Link} to="/split-data">Pembagian Data</Alert.Link> untuk melanjutkan proses seleksi.</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button as={Link} to="/split-data" variant="outline-warning">
                            Pergi ke Pembagian Data
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid>
            {/* Enhanced Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h2 fw-bolder text-dark mb-1">Proses Seleksi C4.5</h1>
                    <p className="text-muted mb-0">Bangun pohon keputusan C4.5 dan evaluasi akurasi untuk sistem pendukung keputusan beasiswa</p>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {processingTime && (
                        <Badge bg="info" className="fs-6">
                            <Clock className="me-1" size={12} />
                            Last: {processingTime}s
                        </Badge>
                    )}
                    {modelStatus && (
                        <Badge bg={modelStatus.isTrained ? 'success' : 'secondary'} className="fs-6">
                            <CheckCircle className="me-1" size={12} />
                            {modelStatus.isTrained ? 'Pohon Keputusan Siap' : 'Pohon Belum Dibuat'}
                        </Badge>
                    )}
                    <Button 
                        variant="outline-info" 
                        size="sm" 
                        onClick={() => setShowModelInfo(true)}
                    >
                        <InfoCircle className="me-1" size={14} />
                        Info Model
                    </Button>
                    {isModelTrained && (
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={resetModel}
                            disabled={isLoading}
                        >
                            <ArrowCounterclockwise className="me-1" size={14} />
                            Reset Model
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress Modal */}
            <Modal show={showProgress} backdrop="static" keyboard={false} centered className="progress-modal">
                <Modal.Body className="text-center p-4">
                    <div className="mb-3">
                        <Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}} />
                    </div>
                    <h5 className="mb-3">Memproses...</h5>
                    <ProgressBar 
                        now={processProgress} 
                        className="mb-3 progress-animated" 
                        style={{height: '8px', '--progress-width': `${processProgress}%`}} 
                        animated 
                    />
                    <div className="small text-muted">
                        {progressSteps[Math.floor((processProgress / 100) * progressSteps.length)] || 'Memproses...'}
                    </div>
                    <div className="small text-muted mt-2">
                        {Math.round(processProgress)}% selesai
                    </div>
                </Modal.Body>
            </Modal>

            {/* Process Stepper */}
            <div ref={stepperRef} className={`scroll-animate-scale ${stepperVisible ? 'visible' : ''}`}>
                <ProcessStepper currentStep={currentStep} steps={PROCESS_STEPS} />
            </div>

            {/* Enhanced Data Summary */}
            <Row className="g-4 mb-4" ref={statsRef}>
                <Col md={3}>
                    <div className={`scroll-animate ${statsVisible ? 'visible' : ''}`} style={{transitionDelay: '0.1s'}}>
                        <Card className="stats-card border-0 h-100 card-hover">
                            <Card.Body className="text-center p-4">
                                <div className="stats-icon bg-primary bg-opacity-10 rounded-circle mx-auto mb-3">
                                    <PlayFill className="text-primary icon-pulse" size={24} />
                                </div>
                                <h6 className="text-muted mb-1">Data Latih</h6>
                                <div className="fs-2 fw-bold text-primary mb-2 counter-number">{trainingIds.length}</div>
                                <small className="text-muted">Data untuk membangun pohon</small>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
                <Col md={3}>
                    <div className={`scroll-animate ${statsVisible ? 'visible' : ''}`} style={{transitionDelay: '0.2s'}}>
                        <Card className="stats-card border-0 h-100 card-hover">
                            <Card.Body className="text-center p-4">
                                <div className="stats-icon bg-success bg-opacity-10 rounded-circle mx-auto mb-3">
                                    <Clipboard2Check className="text-success icon-hover" size={24} />
                                </div>
                                <h6 className="text-muted mb-1">Data Uji</h6>
                                <div className="fs-2 fw-bold text-success mb-2 counter-number">{testingIds.length}</div>
                                <small className="text-muted">Data untuk evaluasi pohon</small>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
                <Col md={3}>
                    <div className={`scroll-animate ${statsVisible ? 'visible' : ''}`} style={{transitionDelay: '0.3s'}}>
                        <Card className="stats-card border-0 h-100 card-hover">
                            <Card.Body className="text-center p-4">
                                <div className="stats-icon bg-info bg-opacity-10 rounded-circle mx-auto mb-3">
                                    <CheckCircle className="text-info icon-hover" size={24} />
                                </div>
                                <h6 className="text-muted mb-1">Atribut Aktif</h6>
                                <div className="fs-2 fw-bold text-info mb-2 counter-number">
                                    {selectedAttributesList.filter(attr => attr.isSelected).length}
                                </div>
                                <small className="text-muted">Fitur yang digunakan</small>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
                <Col md={3}>
                    <div className={`scroll-animate ${statsVisible ? 'visible' : ''}`} style={{transitionDelay: '0.4s'}}>
                        <Card className="stats-card border-0 h-100 card-hover">
                            <Card.Body className="text-center p-4">
                                <div className="stats-icon bg-warning bg-opacity-10 rounded-circle mx-auto mb-3">
                                    <Cpu className="text-warning icon-pulse" size={24} />
                                </div>
                                <h6 className="text-muted mb-1">Algoritma</h6>
                                <div className="fs-4 fw-bold text-warning mb-2 counter-number">C4.5</div>
                                <small className="text-muted">Decision Tree</small>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row>

            {/* Action Cards */}
            <div ref={actionsRef} className={`scroll-animate-left ${actionsVisible ? 'visible' : ''}`}>
                <Accordion defaultActiveKey="0" className="mb-4">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>
                        <Cpu className="me-2" />
                        Langkah 1: Bangun Pohon Keputusan C4.5
                    </Accordion.Header>
                    <Accordion.Body>
                        <Row>
                            <Col md={8}>
                                <p>Gunakan <strong>{trainingIds.length}</strong> data training untuk membangun pohon keputusan C4.5 dengan <strong>{selectedAttributesList.filter(attr => attr.isSelected).length}</strong> atribut terpilih.</p>
                                <ul className="small text-muted">
                                    <li>Algoritma C4.5 akan menghitung Gain Ratio untuk setiap atribut</li>
                                    <li>Pohon keputusan dibuat berdasarkan atribut dengan Gain Ratio tertinggi</li>
                                    <li>Pastikan minimal 5 atribut sudah dipilih di halaman Pengaturan Atribut</li>
                                    <li><strong>"Pohon Belum Dibuat"</strong> artinya algoritma C4.5 belum dijalankan untuk membuat struktur pohon keputusan</li>
                                </ul>
                            </Col>
                            <Col md={4} className="d-flex align-items-center">
                                <Button 
                                    className={`w-100 btn-animated ${isLoading && currentAction === 'train' ? 'processing' : ''} ${isModelTrained ? 'success' : ''}`}
                                    onClick={handleTrainModel} 
                                    disabled={isLoading}
                                    size="lg"
                                >
                                    {isLoading && currentAction === 'train' ? (
                                        <Spinner as="span" size="sm" className="me-2" />
                                    ) : (
                                        <Cpu className="me-2" />
                                    )}
                                    {isModelTrained ? 'Bangun Ulang Pohon' : 'Bangun Pohon Keputusan'}
                                </Button>
                            </Col>
                        </Row>
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1">
                    <Accordion.Header>
                        <Clipboard2Check className="me-2" />
                        Langkah 2: Evaluasi Pohon Keputusan
                    </Accordion.Header>
                    <Accordion.Body>
                        <Row>
                            <Col md={8}>
                                <p>Evaluasi akurasi pohon keputusan menggunakan <strong>{testingIds.length}</strong> data testing untuk mengukur performa klasifikasi.</p>
                                <ul className="small text-muted">
                                    <li>Pohon keputusan akan diuji dengan data yang tidak digunakan saat pembangunan</li>
                                    <li>Hasil akan menampilkan confusion matrix dan metrik evaluasi</li>
                                    <li>Metrik meliputi akurasi, presisi, recall, dan F1-score seperti di RapidMiner</li>
                                </ul>
                            </Col>
                            <Col md={4} className="d-flex align-items-center">
                                <Button 
                                    variant="success" 
                                    className={`w-100 btn-animated ${isLoading && currentAction === 'test' ? 'processing' : ''}`}
                                    onClick={() => handleTestModel('test')} 
                                    disabled={!isModelTrained || isLoading}
                                    size="lg"
                                >
                                    {isLoading && currentAction === 'test' ? (
                                        <Spinner as="span" size="sm" className="me-2" />
                                    ) : (
                                        <Clipboard2Check className="me-2" />
                                    )}
                                    Evaluasi Pohon
                                </Button>
                            </Col>
                        </Row>
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2">
                    <Accordion.Header>
                        <Globe className="me-2" />
                        Langkah 3: Terapkan Pohon ke Semua Data
                    </Accordion.Header>
                    <Accordion.Body>
                        <Row>
                            <Col md={8}>
                                <p>Terapkan pohon keputusan yang sudah dibuat ke <strong>seluruh dataset</strong> untuk membuat laporan akhir dan klasifikasi lengkap.</p>
                                <ul className="small text-muted">
                                    <li>Pohon keputusan akan diterapkan ke semua data (training + testing)</li>
                                    <li>Hasil dapat digunakan untuk laporan final sistem pendukung keputusan</li>
                                    <li>Data klasifikasi akan tersedia di halaman laporan</li>
                                </ul>
                            </Col>
                            <Col md={4} className="d-flex align-items-center">
                                <Button 
                                    variant="secondary" 
                                    className={`w-100 btn-animated ${isLoading && currentAction === 'test-all' ? 'processing' : ''}`}
                                    onClick={() => handleTestModel('test-all')} 
                                    disabled={!isModelTrained || isLoading}
                                    size="lg"
                                >
                                    {isLoading && currentAction === 'test-all' ? (
                                        <Spinner as="span" size="sm" className="me-2" />
                                    ) : (
                                        <Globe className="me-2" />
                                    )}
                                    Terapkan ke Semua Data
                                </Button>
                            </Col>
                        </Row>
                    </Accordion.Body>
                </Accordion.Item>
                </Accordion>
            </div>

            {/* Tree Visualization */}
            <div className="mb-4">
                <div className="tree-container">
                    <TreeVisualization isModelTrained={isModelTrained} />
                </div>
            </div>

            {/* Evaluation Results */}
            {evaluationResults && (
                <div className="mb-4" ref={resultsRef}>
                    <div className={`scroll-animate-right ${resultsVisible ? 'visible' : ''}`}>
                        <EvaluationResults 
                            evaluationResults={evaluationResults}
                            onDownload={() => toast.success('Hasil evaluasi berhasil diunduh!')}
                        />
                    </div>
                </div>
            )}
            {/* Model Info Modal */}
            <Modal show={showModelInfo} onHide={() => setShowModelInfo(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <InfoCircle className="me-2" />
                        Informasi Model C4.5
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-4">
                        <Col md={6}>
                            <h6>Konfigurasi Model</h6>
                            <Table size="sm" className="mb-0">
                                <tbody>
                                    <tr>
                                        <td>Algoritma</td>
                                        <td><Badge bg="primary">C4.5 Decision Tree</Badge></td>
                                    </tr>
                                    <tr>
                                        <td>Data Latih</td>
                                        <td><strong>{trainingIds.length}</strong> sampel</td>
                                    </tr>
                                    <tr>
                                        <td>Data Uji</td>
                                        <td><strong>{testingIds.length}</strong> sampel</td>
                                    </tr>
                                    <tr>
                                        <td>Atribut</td>
                                        <td><strong>{selectedAttributesList.filter(attr => attr.isSelected).length}</strong> fitur</td>
                                    </tr>
                                    <tr>
                                        <td>Status</td>
                                        <td>
                                            <Badge bg={isModelTrained ? 'success' : 'secondary'}>
                                                {isModelTrained ? 'Terlatih' : 'Belum Terlatih'}
                                            </Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Col>
                        <Col md={6}>
                            <h6>Atribut yang Digunakan</h6>
                            <div className="d-flex flex-wrap gap-2">
                                {selectedAttributesList
                                    .filter(attr => attr.isSelected)
                                    .map(attr => (
                                        <Badge key={attr.id} bg="info" className="fs-6">
                                            {attr.displayName}
                                        </Badge>
                                    ))
                                }
                            </div>
                            {processingTime && (
                                <div className="mt-3">
                                    <h6>Performa Terakhir</h6>
                                    <div className="small">
                                        <div>Waktu Training: <strong>{processingTime}s</strong></div>
                                        <div>Status: <Badge bg="success">Berhasil</Badge></div>
                                    </div>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModelInfo(false)}>
                        Tutup
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SelectionProcessPage;