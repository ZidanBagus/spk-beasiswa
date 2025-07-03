import React from 'react';
import { Card, Table, Button, Row, Col, Tooltip, OverlayTrigger, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BarChartLine, QuestionCircleFill, Download, FileEarmarkText } from 'react-bootstrap-icons';

const EvaluationResults = ({ evaluationResults, onDownload }) => {
    if (!evaluationResults) return null;

    const renderTooltip = (text) => (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {text}
        </Tooltip>
    );

    const renderConfusionMatrix = () => {
        if (!evaluationResults.confusionMatrix) return null;
        
        const matrix = evaluationResults.confusionMatrix;
        const posLabel = 'terima';
        const negLabel = 'tidak';
        const TP = matrix[posLabel]?.[posLabel] ?? 0;
        const FN = matrix[posLabel]?.[negLabel] ?? 0;
        const FP = matrix[negLabel]?.[posLabel] ?? 0;
        const TN = matrix[negLabel]?.[negLabel] ?? 0;

        return (
            <div className="text-center">
                <Table bordered className="text-center mt-3" style={{ maxWidth: '600px', margin: 'auto' }}>
                    <thead className="table-light">
                        <tr>
                            <th colSpan={2} rowSpan={2} className="align-middle text-end pe-3 fs-6">
                                Akurasi:<br/>
                                <Badge bg="primary" className="fs-5">{evaluationResults.accuracy}%</Badge>
                            </th>
                            <th colSpan={2}>Prediksi Model</th>
                        </tr>
                        <tr>
                            <th className="table-success text-capitalize">{posLabel}</th>
                            <th className="table-danger text-capitalize">{negLabel}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th rowSpan={2} className="align-middle table-light" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                Data Aktual
                            </th>
                            <th className="table-light text-capitalize">{posLabel}</th>
                            <td className="bg-success-subtle fw-bold">
                                {TP} <br/>
                                <small className="text-muted">(True Positive)</small>
                            </td>
                            <td>
                                {FN} <br/>
                                <small className="text-muted">(False Negative)</small>
                            </td>
                        </tr>
                        <tr>
                            <th className="table-light text-capitalize">{negLabel}</th>
                            <td>
                                {FP} <br/>
                                <small className="text-muted">(False Positive)</small>
                            </td>
                            <td className="bg-success-subtle fw-bold">
                                {TN} <br/>
                                <small className="text-muted">(True Negative)</small>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        );
    };

    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 90) return 'success';
        if (accuracy >= 80) return 'warning';
        return 'danger';
    };

    const downloadResults = () => {
        const data = {
            timestamp: new Date().toISOString(),
            evaluation: evaluationResults
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `evaluation_results_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        if (onDownload) onDownload();
    };

    return (
        <Card className="shadow-sm">
            <Card.Header className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <BarChartLine className="me-2" />
                    Hasil Evaluasi Model
                </div>
                <Button variant="outline-primary" size="sm" onClick={downloadResults}>
                    <Download className="me-1" size={14} />
                    Unduh Hasil
                </Button>
            </Card.Header>
            <Card.Body>
                {/* Confusion Matrix */}
                <div className="mb-4">
                    <h6 className="text-center mb-3">Confusion Matrix</h6>
                    {renderConfusionMatrix()}
                </div>

                <hr className="my-4" />

                {/* Metrics Summary */}
                <Row className="mb-4">
                    <Col md={6} lg={3} className="mb-3">
                        <Card className={`border-${getAccuracyColor(evaluationResults.accuracy)} h-100`}>
                            <Card.Body className="text-center">
                                <div className={`text-${getAccuracyColor(evaluationResults.accuracy)} fw-bold fs-4`}>
                                    {evaluationResults.accuracy}%
                                </div>
                                <div className="text-muted small">Akurasi</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={3} className="mb-3">
                        <Card className="border-info h-100">
                            <Card.Body className="text-center">
                                <div className="text-info fw-bold fs-4">{evaluationResults.precision}%</div>
                                <div className="text-muted small">Presisi</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={3} className="mb-3">
                        <Card className="border-warning h-100">
                            <Card.Body className="text-center">
                                <div className="text-warning fw-bold fs-4">{evaluationResults.recall}%</div>
                                <div className="text-muted small">Recall</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={3} className="mb-3">
                        <Card className="border-secondary h-100">
                            <Card.Body className="text-center">
                                <div className="text-secondary fw-bold fs-4">{evaluationResults.f1score}%</div>
                                <div className="text-muted small">F1-Score</div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Detailed Metrics */}
                <h6>Penjelasan Metrik</h6>
                <Row as="dl" className="mt-3">
                    <dt className="col-sm-3 d-flex align-items-center">
                        Akurasi
                        <OverlayTrigger 
                            placement="top" 
                            overlay={renderTooltip('Persentase prediksi yang benar dari total prediksi')}
                        >
                            <QuestionCircleFill className="ms-2 text-muted" size={14} />
                        </OverlayTrigger>
                    </dt>
                    <dd className="col-sm-9">
                        <Badge bg={getAccuracyColor(evaluationResults.accuracy)} className="me-2">
                            {evaluationResults.accuracy}%
                        </Badge>
                        Seberapa sering model benar secara keseluruhan
                    </dd>
                    
                    <dt className="col-sm-3 d-flex align-items-center">
                        Presisi
                        <OverlayTrigger 
                            placement="top" 
                            overlay={renderTooltip('Dari semua yang diprediksi "terima", berapa persen yang benar')}
                        >
                            <QuestionCircleFill className="ms-2 text-muted" size={14} />
                        </OverlayTrigger>
                    </dt>
                    <dd className="col-sm-9">
                        <Badge bg="info" className="me-2">{evaluationResults.precision}%</Badge>
                        Ketepatan prediksi positif
                    </dd>

                    <dt className="col-sm-3 d-flex align-items-center">
                        Recall
                        <OverlayTrigger 
                            placement="top" 
                            overlay={renderTooltip('Dari semua yang seharusnya "terima", berapa persen yang berhasil ditemukan')}
                        >
                            <QuestionCircleFill className="ms-2 text-muted" size={14} />
                        </OverlayTrigger>
                    </dt>
                    <dd className="col-sm-9">
                        <Badge bg="warning" className="me-2">{evaluationResults.recall}%</Badge>
                        Kemampuan menemukan kasus positif
                    </dd>

                    <dt className="col-sm-3 d-flex align-items-center">
                        F1-Score
                        <OverlayTrigger 
                            placement="top" 
                            overlay={renderTooltip('Rata-rata harmonis antara Presisi dan Recall')}
                        >
                            <QuestionCircleFill className="ms-2 text-muted" size={14} />
                        </OverlayTrigger>
                    </dt>
                    <dd className="col-sm-9">
                        <Badge bg="secondary" className="me-2">{evaluationResults.f1score}%</Badge>
                        Keseimbangan antara presisi dan recall
                    </dd>
                </Row>

                {/* Action Buttons */}
                <div className="text-center mt-4">
                    <Button as={Link} to="/reports" variant="primary" className="me-2">
                        <FileEarmarkText className="me-1" />
                        Lihat Laporan Detail
                    </Button>
                    <Button as={Link} to="/simulation" variant="outline-secondary">
                        Simulasi Prediksi
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default EvaluationResults;
