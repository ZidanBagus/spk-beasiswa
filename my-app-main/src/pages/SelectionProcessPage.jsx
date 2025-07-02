import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert, Table, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Cpu, Clipboard2Check, Globe, BarChartLine, QuestionCircleFill } from 'react-bootstrap-icons';
import selectionService from '../services/selectionService';
import { useAttributes } from '../contexts/AttributeContext';
import { toast } from 'react-toastify';

const SelectionProcessPage = () => {
    const [trainingIds, setTrainingIds] = useState([]);
    const [testingIds, setTestingIds] = useState([]);
    const [isDataReady, setIsDataReady] = useState(false);
    const [isModelTrained, setIsModelTrained] = useState(false);
    const [evaluationResults, setEvaluationResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);

    const { attributes: selectedAttributesList } = useAttributes();

    useEffect(() => {
        const storedTrainingIds = JSON.parse(sessionStorage.getItem('trainingSetIds'));
        const storedTestingIds = JSON.parse(sessionStorage.getItem('testingSetIds'));
        if (storedTrainingIds && storedTestingIds) {
            setTrainingIds(storedTrainingIds);
            setTestingIds(storedTestingIds);
            setIsDataReady(true);
        }
    }, []);

    const handleTrainModel = async () => {
        setIsLoading(true);
        setCurrentAction('train');
        setEvaluationResults(null);
        setIsModelTrained(false);
        const toastId = toast.loading("Melatih model C4.5 dengan data latih...");
        const selectedAttributeNames = selectedAttributesList.filter(attr => attr.isSelected).map(attr => attr.attributeName);
            
        if (selectedAttributeNames.length < 2) {
            toast.update(toastId, { render: "Gagal! Harap pilih setidaknya 2 atribut di halaman Pengaturan Atribut.", type: 'error', isLoading: false, autoClose: 5000 });
            setIsLoading(false);
            setCurrentAction(null);
            return;
        }

        try {
            const response = await selectionService.trainModel(trainingIds, selectedAttributeNames);
            toast.update(toastId, { render: response.message, type: 'success', isLoading: false, autoClose: 3000 });
            setIsModelTrained(true);
        } catch (error) {
            toast.update(toastId, { render: error.message || "Gagal melatih model.", type: 'error', isLoading: false, autoClose: 5000 });
        } finally {
            setIsLoading(false);
            setCurrentAction(null);
        }
    };

    const handleTestModel = async (mode = 'test') => {
        setIsLoading(true);
        setCurrentAction(mode);
        const actionText = mode === 'test' ? "Menguji model dengan data uji..." : "Menerapkan model pada seluruh data...";
        const toastId = toast.loading(actionText);

        try {
            const response = mode === 'test' 
                ? await selectionService.testModel(testingIds)
                : await selectionService.testModelOnAllData();
            
            setEvaluationResults(response.evaluation);
            toast.update(toastId, { render: response.message, type: 'success', isLoading: false, autoClose: 3000 });
        } catch (error) {
            toast.update(toastId, { render: error.message || "Gagal melakukan pengujian.", type: 'error', isLoading: false, autoClose: 5000 });
        } finally {
            setIsLoading(false);
            setCurrentAction(null);
        }
    };
    
    if (!isDataReady) {
        return (
            <Alert variant="warning">
                <Alert.Heading>Data Belum Dibagi</Alert.Heading>
                <p>Data latih dan data uji tidak ditemukan. Silakan bagi data terlebih dahulu di halaman <Alert.Link as={Link} to="/split-data">Pembagian Data</Alert.Link> untuk melanjutkan.</p>
            </Alert>
        );
    }
    
    const renderConfusionMatrix = () => {
        if (!evaluationResults || !evaluationResults.confusionMatrix) return null;
        const matrix = evaluationResults.confusionMatrix;
        const posLabel = 'terima';
        const negLabel = 'tidak';
        const TP = matrix[posLabel]?.[posLabel] ?? 0;
        const FN = matrix[posLabel]?.[negLabel] ?? 0;
        const FP = matrix[negLabel]?.[posLabel] ?? 0;
        const TN = matrix[negLabel]?.[negLabel] ?? 0;

        return (
             <Table bordered className="text-center mt-3" style={{ maxWidth: '600px', margin: 'auto' }}>
                <thead className="table-light">
                    <tr>
                        <th colSpan={2} rowSpan={2} className="align-middle text-end pe-3 fs-6">Akurasi:<br/><span className='fw-bold fs-5'>{evaluationResults.accuracy}%</span></th>
                        <th colSpan={2}>Prediksi Model</th>
                    </tr>
                    <tr>
                        <th className="table-success text-capitalize">{posLabel}</th>
                        <th className="table-danger text-capitalize">{negLabel}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th rowSpan={2} className="align-middle table-light" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Data Aktual</th>
                        <th className="table-light text-capitalize">{posLabel}</th>
                        <td className="bg-success-subtle fw-bold">{TP} <br/><small>(Benar Positif)</small></td>
                        <td>{FN} <br/><small>(Salah Negatif)</small></td>
                    </tr>
                    <tr>
                        <th className="table-light text-capitalize">{negLabel}</th>
                        <td>{FP} <br/><small>(Salah Positif)</small></td>
                        <td className="bg-success-subtle fw-bold">{TN} <br/><small>(Benar Negatif)</small></td>
                    </tr>
                </tbody>
            </Table>
        );
    }

    const renderTooltip = (props, text) => (<Tooltip id="button-tooltip" {...props}>{text}</Tooltip>);

    return (
        <Container fluid>
            <h1 className="h2 fw-bolder text-dark mb-4">Proses Seleksi (Latih & Uji Model)</h1>
            <Row>
                <Col md={4} className="mb-4">
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="d-flex flex-column"><Card.Title className="d-flex align-items-center"><Cpu className="me-2"/>Langkah 1: Latih Model</Card.Title><Card.Text>Gunakan <strong>{trainingIds.length}</strong> data latih untuk membangun model pohon keputusan C4.5.</Card.Text><Button className="mt-auto" onClick={handleTrainModel} disabled={isLoading}>{isLoading && currentAction === 'train' ? <Spinner as="span" size="sm" className="me-2"/> : ''} Latih Model</Button></Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card className="h-100 shadow-sm">
                        <Card.Body className="d-flex flex-column"><Card.Title className="d-flex align-items-center"><Clipboard2Check className="me-2"/>Langkah 2: Uji Model</Card.Title><Card.Text>Evaluasi performa model menggunakan <strong>{testingIds.length}</strong> data uji.</Card.Text><Button variant="success" className="mt-auto" onClick={() => handleTestModel('test')} disabled={!isModelTrained || isLoading}>{isLoading && currentAction === 'test' ? <Spinner as="span" size="sm" className="me-2"/> : ''} Uji Dengan Data Uji</Button></Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                     <Card className="h-100 shadow-sm">
                        <Card.Body className="d-flex flex-column"><Card.Title className="d-flex align-items-center"><Globe className="me-2"/>Terapkan Model</Card.Title><Card.Text>Terapkan model yang sudah dilatih ke **seluruh dataset** untuk membuat laporan akhir.</Card.Text><Button variant="secondary" className="mt-auto" onClick={() => handleTestModel('test-all')} disabled={!isModelTrained || isLoading}>{isLoading && currentAction === 'test-all' ? <Spinner as="span" size="sm" className="me-2"/> : ''} Terapkan ke Semua Data</Button></Card.Body>
                    </Card>
                </Col>
            </Row>

            {evaluationResults && (
                <Card className="mt-4 shadow-sm">
                    <Card.Header as="h5"><BarChartLine className="me-2"/>Hasil Evaluasi Model</Card.Header>
                    <Card.Body>
                        {renderConfusionMatrix()}
                        <hr className="my-4"/>
                        <h5>Penjelasan Metrik</h5>
                        <Row as="dl" className="mt-3">
                            <dt className="col-sm-3 d-flex align-items-center">Akurasi<OverlayTrigger placement="top" overlay={renderTooltip({}, 'Seberapa sering model benar secara keseluruhan.')}><QuestionCircleFill className="ms-2 text-muted" size={14}/></OverlayTrigger></dt>
                            <dd className="col-sm-9">{evaluationResults.accuracy}%</dd>
                            
                            <dt className="col-sm-3 d-flex align-items-center">Presisi<OverlayTrigger placement="top" overlay={renderTooltip({}, 'Dari semua yang diprediksi "terima", berapa persen yang benar.')}><QuestionCircleFill className="ms-2 text-muted" size={14}/></OverlayTrigger></dt>
                            <dd className="col-sm-9">{evaluationResults.precision}%</dd>

                            <dt className="col-sm-3 d-flex align-items-center">Recall (Sensitivity)<OverlayTrigger placement="top" overlay={renderTooltip({}, 'Dari semua yang seharusnya "terima", berapa persen yang berhasil ditemukan model.')}><QuestionCircleFill className="ms-2 text-muted" size={14}/></OverlayTrigger></dt>
                            <dd className="col-sm-9">{evaluationResults.recall}%</dd>

                            <dt className="col-sm-3 d-flex align-items-center">F1-Score<OverlayTrigger placement="top" overlay={renderTooltip({}, 'Rata-rata penyeimbang antara Presisi dan Recall.')}><QuestionCircleFill className="ms-2 text-muted" size={14}/></OverlayTrigger></dt>
                            <dd className="col-sm-9">{evaluationResults.f1score}%</dd>
                        </Row>
                         <div className="text-center mt-4">
                            <Button as={Link} to="/reports">Lihat Laporan Detail Hasil Uji</Button>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default SelectionProcessPage;