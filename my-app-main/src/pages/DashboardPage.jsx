import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Placeholder, Badge, Button, Modal, Table, ProgressBar } from 'react-bootstrap';
import {
    PeopleFill, BarChartSteps, PersonPlusFill, LightningChargeFill, GraphUp, Diagram3Fill, PuzzleFill,
    Award, Clock, Cpu, Eye, Download, Calendar, CheckCircle, XCircle, InfoCircle
} from 'react-bootstrap-icons';
import applicantService from '../services/applicantService';
import reportService from '../services/reportService';
import './DashboardPage.css';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, Title,
    CategoryScale, LinearScale, BarElement, PointElement, LineElement
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { chartConfig } from '../components/dashboard/chartConfig';

// Register Chart.js components
ChartJS.register(
    ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale,
    BarElement, PointElement, LineElement, ChartDataLabels
);



// Utility to create default chart data
const createDefaultChartData = (labels, colors) => ({
    labels,
    datasets: [
        { label: 'Terima', data: Array(labels.length).fill(0), backgroundColor: colors.terima.bg, borderColor: colors.terima.border, borderWidth: 1 },
        { label: 'Tidak', data: Array(labels.length).fill(0), backgroundColor: colors.tidak.bg, borderColor: colors.tidak.border, borderWidth: 1 }
    ]
});

// Chart options generator with improved typography and spacing
const getChartOptions = (title, type = 'bar', isGrouped = false) => {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { font: { size: 12 }, padding: 15 } },
            title: { display: true, text: title, font: { size: 16, weight: '600' }, padding: { bottom: 15 } },
            datalabels: { display: false }
        },
        layout: { padding: { top: 10, bottom: 10 } }
    };

    if (type === 'doughnut') {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: { position: 'right', labels: { font: { size: 12 }, padding: 20 } }
            }
        };
    }

    return {
        ...baseOptions,
        scales: {
            x: {
                stacked: type === 'bar' && !isGrouped,
                ticks: { font: { size: 11 }, maxRotation: 0, autoSkip: true }
            },
            y: {
                stacked: type === 'bar' && !isGrouped,
                beginAtZero: true,
                ticks: { precision: 0, font: { size: 11 } }
            }
        },
        ...(type === 'line' && { elements: { line: { tension: 0.3 }, point: { radius: 3 } } })
    };
};

const DashboardPage = () => {
    const [stats, setStats] = useState({
        summary: { Terima: 0, Tidak: 0, total: 0 },
        applicants: { totalApplicants: 0, applicantsToday: 0, applicantsLast7Days: 0 },
        charts: {
            ipk: createDefaultChartData(chartConfig.ipk.labels, chartConfig.ipk.colors),
            penghasilan: createDefaultChartData(chartConfig.penghasilan.labels, chartConfig.penghasilan.colors),
            organisasi: createDefaultChartData(chartConfig.organisasi.labels, chartConfig.organisasi.colors),
            tanggungan: createDefaultChartData(chartConfig.tanggungan.labels, chartConfig.tanggungan.colors),
            ukm: createDefaultChartData(chartConfig.ukm.labels, chartConfig.ukm.colors),
        }
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInsights, setShowInsights] = useState(false);
    const [modelStatus, setModelStatus] = useState(null);
    const [systemHealth, setSystemHealth] = useState({
        database: 'healthy',
        model: 'ready',
        lastUpdate: new Date().toISOString()
    });
    const doughnutChartRef = useRef();

    const calculateInsights = useMemo(() => {
        if (!stats.summary.total) return null;
        
        const acceptanceRate = ((stats.summary.Terima / stats.summary.total) * 100).toFixed(1);
        const totalProcessed = stats.summary.total;
        const efficiency = totalProcessed > 0 ? 'Tinggi' : 'Rendah';
        
        return {
            acceptanceRate,
            totalProcessed,
            efficiency,
            recommendations: [
                acceptanceRate > 50 ? 'Tingkat penerimaan cukup baik' : 'Perlu evaluasi kriteria seleksi',
                totalProcessed > 100 ? 'Data training mencukupi untuk model C4.5' : 'Perlu lebih banyak data historis',
                'Model siap digunakan untuk prediksi otomatis'
            ]
        };
    }, [stats.summary]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [applicantStatsRes, reportRes] = await Promise.all([
                applicantService.getApplicantStats(),
                reportService.getAllSelectionResults({ limit: 99999 })
            ]);

            const results = reportRes.results || [];

            const summary = results.reduce((acc, curr) => {
                const status = (curr.statusKelulusan || "Tidak").trim();
                if (status === 'Terima') acc.Terima += 1; else acc.Tidak += 1;
                return acc;
            }, { Terima: 0, Tidak: 0 });
            summary.total = results.length;

            const processChartData = (attribute, labels, getCategoryFunc) => {
                const chartData = createDefaultChartData(labels, chartConfig[attribute].colors);
                results.forEach(item => {
                    const category = getCategoryFunc(item);
                    const index = labels.indexOf(category);
                    if (index > -1) {
                        const status = (item.statusKelulusan || '').trim();
                        if (status === 'Terima') chartData.datasets[0].data[index]++;
                        else if (status === 'Tidak') chartData.datasets[1].data[index]++;
                    }
                });
                return chartData;
            };

            // Fungsi khusus untuk chart organisasi dan UKM (grouped bar)
            const processGroupedBarData = (attribute, labels, getCategoryFunc) => {
                const data = {
                    Ya: { Terima: 0, Tidak: 0 },
                    Tidak: { Terima: 0, Tidak: 0 }
                };

                results.forEach(item => {
                    const category = getCategoryFunc(item);
                    const status = (item.statusKelulusan || '').trim();
                    const key = (category === 'Ya' || category === 'Ikut') ? 'Ya' : 'Tidak';

                    if (status === 'Terima') {
                        data[key].Terima++;
                    } else {
                        data[key].Tidak++;
                    }
                });

                return {
                    labels,
                    datasets: [
                        {
                            label: 'Diterima',
                            data: [data.Ya.Terima, data.Tidak.Terima],
                            backgroundColor: chartConfig[attribute].colors.terima.bg,
                            borderColor: chartConfig[attribute].colors.terima.border,
                            borderWidth: 1,
                            barPercentage: 0.4
                        },
                        {
                            label: 'Tidak Diterima',
                            data: [data.Ya.Tidak, data.Tidak.Tidak],
                            backgroundColor: chartConfig[attribute].colors.tidak.bg,
                            borderColor: chartConfig[attribute].colors.tidak.border,
                            borderWidth: 1,
                            barPercentage: 0.4
                        }
                    ]
                };
            };

            setStats({
                summary,
                applicants: applicantStatsRes || stats.applicants,
                charts: {
                    ipk: processChartData('ipk', chartConfig.ipk.labels, (item) => {
                        const ipk = parseFloat(item.ipk);
                        if (ipk < 3.0) return '<3.00'; if (ipk <= 3.25) return '3.00-3.25'; if (ipk <= 3.50) return '3.26-3.50'; if (ipk <= 3.75) return '3.51-3.75'; return '>3.75';
                    }),
                    penghasilan: processChartData('penghasilan', chartConfig.penghasilan.labels, item => item.penghasilanOrtu),
                    organisasi: processGroupedBarData('organisasi', chartConfig.organisasi.labels, item => item.ikutOrganisasi),
                    tanggungan: processChartData('tanggungan', chartConfig.tanggungan.labels, (item) => {
                        const tanggungan = parseInt(item.jmlTanggungan);
                        if (tanggungan <= 1) return '1'; if (tanggungan === 2) return '2'; if (tanggungan === 3) return '3'; if (tanggungan === 4) return '4'; return '> 4';
                    }),
                    ukm: processGroupedBarData('ukm', chartConfig.ukm.labels, item => item.ikutUKM)
                }
            });

        } catch (err) {
            setError('Gagal memuat data dashboard. Pastikan backend berjalan dan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    }, [chartConfig]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (error) return <Container fluid><Alert variant="danger">{error}</Alert></Container>;

    // Data and options for summary doughnut chart with percentage labels
    const doughnutData = useMemo(() => ({
        labels: ['Diterima', 'Tidak Diterima'],
        datasets: [{
            data: [stats.summary.Terima, stats.summary.Tidak],
            backgroundColor: ['rgba(25, 135, 84, 0.8)', 'rgba(220, 53, 69, 0.8)'],
            borderColor: ['rgba(25, 135, 84, 1)', 'rgba(220, 53, 69, 1)'],
            borderWidth: 2
        }]
    }), [stats.summary]);

    const doughnutOptions = useMemo(() => ({
        ...getChartOptions('Ringkasan Hasil Seleksi', 'doughnut'),
        plugins: {
            ...getChartOptions('Ringkasan Hasil Seleksi', 'doughnut').plugins,
            datalabels: {
                display: true,
                formatter: (value, context) => {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${percentage}%`;
                },
                color: 'white',
                font: { weight: 'bold', size: 12 }
            }
        }
    }), []);

    const ChartCard = ({ title, chartType, chartData, icon, isGrouped = false }) => (
        <Card className="shadow-sm h-100">
            <Card.Header as="h6" className="fw-semibold bg-light border-bottom-0 pt-2 pb-1 px-3 d-flex align-items-center text-truncate">
                {icon} <span className="ms-2 text-truncate">{title}</span>
            </Card.Header>
            <Card.Body style={{ height: '280px' }} className="p-2">
                {isLoading ? <div className="d-flex h-100 justify-content-center align-items-center"><Spinner /></div> : (
                    chartType === 'doughnut' ? <Doughnut options={doughnutOptions} data={chartData} /> :
                    chartType === 'line' ? <Line options={getChartOptions(title, 'line')} data={chartData} /> :
                    <Bar options={getChartOptions(title, 'bar', isGrouped)} data={chartData} />
                )}
            </Card.Body>
        </Card>
    );

    return (
        <Container fluid className="dashboard-container pt-4 pb-4">
            {/* Enhanced Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h2 fw-bolder text-dark mb-1">Dashboard Analytics SPK Beasiswa</h1>
                    <p className="text-muted mb-0">Sistem Pendukung Keputusan menggunakan Algoritma C4.5</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-info" size="sm" onClick={() => setShowInsights(true)}>
                        <GraphUp className="me-1" size={14} /> Insights
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                        <Download className="me-1" size={14} /> Export
                    </Button>
                </div>
            </div>

            {/* System Status Bar */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="py-3">
                    <Row className="align-items-center">
                        <Col md={8}>
                            <div className="d-flex align-items-center gap-4">
                                <div className="d-flex align-items-center">
                                    <div className="status-indicator bg-success me-2"></div>
                                    <span className="small fw-medium">Sistem Aktif</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <Cpu className="text-primary me-2" size={16} />
                                    <span className="small">Model C4.5 Siap</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <Clock className="text-info me-2" size={16} />
                                    <span className="small">Update: {new Date().toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>
                        </Col>
                        <Col md={4} className="text-end">
                            {calculateInsights && (
                                <Badge bg="success" className="fs-6">
                                    <Award className="me-1" size={12} />
                                    Tingkat Penerimaan: {calculateInsights.acceptanceRate}%
                                </Badge>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Enhanced Summary Cards */}
            <Row className="mb-4 g-4">
                <Col lg={3} md={6}>
                    <Card className="summary-card border-0 h-100">
                        <Card.Body className="text-center p-4">
                            <div className="summary-icon bg-primary bg-opacity-10 rounded-circle mx-auto mb-3">
                                <PeopleFill className="text-primary" size={28} />
                            </div>
                            <h6 className="text-muted mb-1">Total Data Historis</h6>
                            <div className="fs-2 fw-bold text-primary mb-2">
                                {isLoading ? <Spinner size="sm" /> : stats.applicants.totalApplicants.toLocaleString()}
                            </div>
                            <small className="text-muted">Pendaftar terdaftar</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="summary-card border-0 h-100">
                        <Card.Body className="text-center p-4">
                            <div className="summary-icon bg-success bg-opacity-10 rounded-circle mx-auto mb-3">
                                <CheckCircle className="text-success" size={28} />
                            </div>
                            <h6 className="text-muted mb-1">Diterima</h6>
                            <div className="fs-2 fw-bold text-success mb-2">
                                {isLoading ? <Spinner size="sm" /> : stats.summary.Terima.toLocaleString()}
                            </div>
                            <ProgressBar 
                                variant="success" 
                                now={stats.summary.total > 0 ? (stats.summary.Terima / stats.summary.total) * 100 : 0} 
                                style={{ height: '4px' }}
                                className="rounded-pill"
                            />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="summary-card border-0 h-100">
                        <Card.Body className="text-center p-4">
                            <div className="summary-icon bg-danger bg-opacity-10 rounded-circle mx-auto mb-3">
                                <XCircle className="text-danger" size={28} />
                            </div>
                            <h6 className="text-muted mb-1">Ditolak</h6>
                            <div className="fs-2 fw-bold text-danger mb-2">
                                {isLoading ? <Spinner size="sm" /> : stats.summary.Tidak.toLocaleString()}
                            </div>
                            <ProgressBar 
                                variant="danger" 
                                now={stats.summary.total > 0 ? (stats.summary.Tidak / stats.summary.total) * 100 : 0} 
                                style={{ height: '4px' }}
                                className="rounded-pill"
                            />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="summary-card border-0 h-100">
                        <Card.Body className="text-center p-4">
                            <div className="summary-icon bg-info bg-opacity-10 rounded-circle mx-auto mb-3">
                                <BarChartSteps className="text-info" size={28} />
                            </div>
                            <h6 className="text-muted mb-1">Total Diproses</h6>
                            <div className="fs-2 fw-bold text-info mb-2">
                                {isLoading ? <Spinner size="sm" /> : stats.summary.total.toLocaleString()}
                            </div>
                            <small className="text-muted">Data training C4.5</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-4 g-3">
                <Col lg={4}>
                    <Card className="shadow h-100 border-0">
                        <Card.Body style={{ height: '300px' }} className="p-3 d-flex justify-content-center align-items-center">
                            {isLoading
                                ? <Spinner animation="border" variant="primary" />
                                : <Doughnut ref={doughnutChartRef} data={doughnutData} options={doughnutOptions} />}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={8}>
                    <ChartCard title="Hasil Berdasarkan IPK" chartType="bar" chartData={stats.charts.ipk} icon={<GraphUp className="text-primary" />} />
                </Col>
            </Row>

            <Row className="mb-4 g-3">
                <Col lg={6}>
                    <ChartCard title="Hasil Berdasarkan Penghasilan Ortu" chartType="line" chartData={stats.charts.penghasilan} icon={<GraphUp className="text-info" />} />
                </Col>
                <Col lg={6}>
                    <ChartCard title={chartConfig.organisasi.title} chartType={chartConfig.organisasi.type} chartData={stats.charts.organisasi} icon={<Diagram3Fill className="text-secondary" />} isGrouped />
                </Col>
            </Row>

            <Row className="mb-4 g-3">
                <Col lg={6}>
                    <ChartCard title="Hasil Berdasarkan Jml. Tanggungan" chartType="bar" chartData={stats.charts.tanggungan} icon={<PeopleFill className="text-warning" />} />
                </Col>
                <Col lg={6}>
                    <ChartCard title={chartConfig.ukm.title} chartType={chartConfig.ukm.type} chartData={stats.charts.ukm} icon={<PuzzleFill className="text-danger" />} isGrouped />
                </Col>
            </Row>
            {/* Insights Modal */}
            <Modal show={showInsights} onHide={() => setShowInsights(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <GraphUp className="me-2" />
                        Analytics Insights
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {calculateInsights && (
                        <Row className="g-4">
                            <Col md={6}>
                                <Card className="h-100">
                                    <Card.Header>
                                        <h6 className="mb-0">Ringkasan Performa</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table size="sm" className="mb-0">
                                            <tbody>
                                                <tr>
                                                    <td>Tingkat Penerimaan</td>
                                                    <td><Badge bg="primary">{calculateInsights.acceptanceRate}%</Badge></td>
                                                </tr>
                                                <tr>
                                                    <td>Total Data Diproses</td>
                                                    <td><strong>{calculateInsights.totalProcessed.toLocaleString()}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td>Efisiensi Sistem</td>
                                                    <td><Badge bg="success">{calculateInsights.efficiency}</Badge></td>
                                                </tr>
                                                <tr>
                                                    <td>Status Model</td>
                                                    <td><Badge bg="info">C4.5 Ready</Badge></td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="h-100">
                                    <Card.Header>
                                        <h6 className="mb-0">Rekomendasi Sistem</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {calculateInsights.recommendations.map((rec, index) => (
                                            <div key={index} className="d-flex align-items-start mb-3">
                                                <InfoCircle className="text-info me-2 mt-1" size={16} />
                                                <span className="small">{rec}</span>
                                            </div>
                                        ))}
                                        <div className="mt-3 p-3 bg-light rounded">
                                            <h6 className="small fw-bold mb-2">Status Sistem:</h6>
                                            <div className="d-flex align-items-center">
                                                <div className="status-indicator bg-success me-2"></div>
                                                <span className="small">Semua komponen berfungsi normal</span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowInsights(false)}>
                        Tutup
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default DashboardPage;

// Additional CSS styles for summary cards (can be added to a CSS file or inline styles)
/*
.summary-card {
    cursor: default;
    transition: transform 0.2s ease-in-out;
}
.summary-card:hover {
    transform: scale(1.05);
}
*/
