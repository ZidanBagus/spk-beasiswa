import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Placeholder } from 'react-bootstrap';
import {
    PeopleFill, BarChartSteps, PieChartFill, PersonPlusFill,
    LightningChargeFill, GraphUp, Diagram3Fill, PuzzleFill
} from 'react-bootstrap-icons';
import applicantService from '../services/applicantService';
import reportService from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, Title,
    CategoryScale, LinearScale, BarElement, PointElement, LineElement
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrasi semua komponen Chart.js
ChartJS.register(
    ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale,
    BarElement, PointElement, LineElement, ChartDataLabels
);

// Komponen Kartu Ringkasan
const SummaryCard = ({ title, value, icon, variant = 'light', isLoading }) => (
    <Card bg={variant} text={variant === 'light' ? 'dark' : 'white'} className="shadow-sm h-100 border-0">
        <Card.Body className="d-flex align-items-center p-2 p-md-3">
            <div className={`fs-2 me-3 text-${variant === 'light' ? 'primary' : 'white'} opacity-75`}>{icon}</div>
            <div>
                <Card.Subtitle className="mb-0 text-uppercase small fw-bold text-muted">{title}</Card.Subtitle>
                {isLoading ? (
                    <Placeholder as={Card.Title} animation="glow" className="mb-0"><Placeholder xs={8} size="lg" /></Placeholder>
                ) : (
                    <Card.Title as="h3" className="fw-bolder mb-0">{String(value)}</Card.Title>
                )}
            </div>
        </Card.Body>
    </Card>
);

// Fungsi utilitas untuk membuat data chart
const createDefaultChartData = (labels, colors) => ({
    labels,
    datasets: [
        { label: 'Terima', data: Array(labels.length).fill(0), backgroundColor: colors.terima.bg, borderColor: colors.terima.border, borderWidth: 1 },
        { label: 'Tidak', data: Array(labels.length).fill(0), backgroundColor: colors.tidak.bg, borderColor: colors.tidak.border, borderWidth: 1 }
    ]
});

// Opsi konfigurasi untuk berbagai jenis chart
const getChartOptions = (title, type = 'bar') => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top', labels: { font: { size: 10 } } },
        title: { display: true, text: title, font: { size: 14, weight: '600' }, padding: { bottom: 10 } },
        datalabels: { display: false }
    },
    scales: {
        x: { stacked: type === 'bar', ticks: { font: { size: 9 } } },
        y: { stacked: type === 'bar', beginAtZero: true, ticks: { precision: 0, font: { size: 9 } } }
    },
    ...(type === 'line' && { elements: { line: { tension: 0.3 }, point: { radius: 2 } } })
});

const organisasiPieColors = [
    '#6c757d', '#adb5bd', '#0d6efd', '#198754', '#ffc107'
];
const ukmBarColors = [
    'rgba(214, 51, 132, 0.7)',
    'rgba(111, 66, 193, 0.7)',
    'rgba(13, 110, 253, 0.7)',
    'rgba(25, 135, 84, 0.7)',
    'rgba(255, 193, 7, 0.7)'
];

const DashboardPage = () => {
    // Definisi label dan warna untuk setiap chart
    const chartConfig = useMemo(() => ({
        ipk: {
            labels: ['<3.00', '3.00-3.25', '3.26-3.50', '3.51-3.75', '>3.75'],
            colors: { terima: { bg: 'rgba(25, 135, 84, 0.7)' }, tidak: { bg: 'rgba(220, 53, 69, 0.7)' } }
        },
        penghasilan: {
            labels: ['Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'],
            colors: { terima: { bg: 'rgba(13, 110, 253, 0.7)' }, tidak: { bg: 'rgba(255, 193, 7, 0.7)' } }
        },
        organisasi: {
            labels: ['Tidak Ikut', 'Anggota Pasif', 'Anggota Aktif', 'Pengurus', 'Ketua/BPH'],
            colors: { terima: { bg: 'rgba(108, 117, 125, 0.7)' }, tidak: { bg: 'rgba(248, 249, 250, 0.7)'} }
        },
        tanggungan: {
            labels: ['1', '2', '3', '4', '> 4'],
            colors: { terima: { bg: 'rgba(23, 162, 184, 0.7)' }, tidak: { bg: 'rgba(255, 193, 7, 0.5)' } }
        },
        ukm: {
            labels: ['Tidak Ikut', 'Anggota Pasif', 'Anggota Aktif', 'Pengurus', 'Ketua/BPH'],
            colors: { terima: { bg: 'rgba(214, 51, 132, 0.7)', border: 'rgba(214, 51, 132, 1)' }, tidak: { bg: 'rgba(111, 66, 193, 0.7)', border: 'rgba(111, 66, 193, 1)' } }
        }
    }), []);

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
    const doughnutChartRef = useRef();

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

            setStats({
                summary,
                applicants: applicantStatsRes || stats.applicants,
                charts: {
                    ipk: processChartData('ipk', chartConfig.ipk.labels, (item) => {
                        const ipk = parseFloat(item.ipk);
                        if (ipk < 3.0) return '<3.00'; if (ipk <= 3.25) return '3.00-3.25'; if (ipk <= 3.50) return '3.26-3.50'; if (ipk <= 3.75) return '3.51-3.75'; return '>3.75';
                    }),
                    penghasilan: processChartData('penghasilan', chartConfig.penghasilan.labels, item => item.penghasilanOrtu),
                    organisasi: processChartData('organisasi', chartConfig.organisasi.labels, item => item.ikutOrganisasi),
                    tanggungan: processChartData('tanggungan', chartConfig.tanggungan.labels, (item) => {
                        const tanggungan = parseInt(item.jmlTanggungan);
                        if (tanggungan <= 1) return '1'; if (tanggungan === 2) return '2'; if (tanggungan === 3) return '3'; if (tanggungan === 4) return '4'; return '> 4';
                    }),
                    ukm: processChartData('ukm', chartConfig.ukm.labels, item => item.ikutUKM)
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

    const doughnutData = {
        labels: ['Diterima', 'Ditolak'],
        datasets: [{
            data: [stats.summary.Terima, stats.summary.Tidak],
            backgroundColor: ['#198754', '#dc3545'],
            borderColor: ['#fff', '#fff'],
            borderWidth: 2, hoverOffset: 4
        }]
    };
    
    const doughnutOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 15 } },
            title: { display: true, text: 'Distribusi Hasil Seleksi', font: { size: 14 } },
            datalabels: {
                formatter: (value, ctx) => {
                    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    return total > 0 ? (value / total * 100).toFixed(1) + "%" : "0%";
                },
                color: '#fff', font: { weight: 'bold', size: 10 }
            }
        },
    };

    if (error) return <Container fluid><Alert variant="danger">{error}</Alert></Container>;

    const ChartCard = ({ title, chartType, chartData, icon }) => (
        <Card className="shadow-sm h-100">
            <Card.Header as="h6" className="fw-semibold bg-light border-bottom-0 pt-2 pb-1 px-3 d-flex align-items-center text-truncate">
                {icon} <span className="ms-2 text-truncate">{title}</span>
            </Card.Header> 
            <Card.Body style={{ height: '280px' }} className="p-2">
                {isLoading ? <div className="d-flex h-100 justify-content-center align-items-center"><Spinner /></div> : (
                    chartType === 'line' ? <Line options={getChartOptions(title, 'line')} data={chartData} /> :
                    <Bar options={getChartOptions(title, 'bar')} data={chartData} />
                )}
            </Card.Body>
        </Card>
    );

    const organisasiPieData = useMemo(() => {
        const data = Array(chartConfig.organisasi.labels.length).fill(0);
        (stats.charts.organisasi.labels || []).forEach((label, i) => {
            data[i] = (stats.charts.organisasi.datasets[0]?.data[i] || 0) + (stats.charts.organisasi.datasets[1]?.data[i] || 0);
        });
        return {
            labels: chartConfig.organisasi.labels,
            datasets: [{
                data,
                backgroundColor: organisasiPieColors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        };
    }, [stats.charts.organisasi, chartConfig.organisasi.labels]);

    const ukmHorizontalBarData = useMemo(() => {
        const data = Array(chartConfig.ukm.labels.length).fill(0);
        (stats.charts.ukm.labels || []).forEach((label, i) => {
            data[i] = (stats.charts.ukm.datasets[0]?.data[i] || 0) + (stats.charts.ukm.datasets[1]?.data[i] || 0);
        });
        return {
            labels: chartConfig.ukm.labels,
            datasets: [{
                label: 'Jumlah',
                data,
                backgroundColor: ukmBarColors,
                borderColor: '#fff',
                borderWidth: 1
            }]
        };
    }, [stats.charts.ukm, chartConfig.ukm.labels]);

    const horizontalBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Keaktifan UKM', font: { size: 14, weight: '600' } },
            datalabels: {
                display: true,
                color: '#fff',
                font: {
                    weight: 'bold'
                },
                formatter: (value) => {
                    return value > 0 ? value : '';
                }
            }
        },
        scales: {
            x: { beginAtZero: true, ticks: { font: { size: 9 } } },
            y: { ticks: { font: { size: 10 } } }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { font: { size: 10 } } },
            title: { display: true, text: 'Proporsi Keaktifan Organisasi', font: { size: 14, weight: '600' } },
            datalabels: {
                display: true,
                formatter: (value, ctx) => {
                    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (value / total * 100).toFixed(1) + "%" : "0%";
                    return `${value} (${percentage})`;
                },
                color: '#fff',
                font: {
                    weight: 'bold'
                }
            }
        }
    };

    return (
        <Container fluid className="pt-4 pb-4" style={{ background: "#f8f9fa", minHeight: "100vh" }}>
            <Row className="mb-4">
                <Col md={3} sm={6} className="mb-3">
                    <SummaryCard title="Total Pendaftar" value={stats.applicants.totalApplicants} icon={<PeopleFill />} isLoading={isLoading} variant="light" />
                </Col>
                <Col md={3} sm={6} className="mb-3">
                    <SummaryCard title="Pendaftar Baru" value={stats.applicants.applicantsToday} icon={<PersonPlusFill />} isLoading={isLoading} variant="info" />
                </Col>
                <Col md={3} sm={6} className="mb-3">
                    <SummaryCard title="Hasil Seleksi" value={stats.summary.total} icon={<BarChartSteps />} isLoading={isLoading} variant="primary" />
                </Col>
                <Col md={3} sm={6} className="mb-3">
                    <SummaryCard title="Diterima" value={stats.summary.Terima} variant="success" icon={<LightningChargeFill />} isLoading={isLoading} />
                </Col>
            </Row>

            <Row>
                <Col lg={4} className="mb-4">
                    <Card className="shadow h-100 border-0">
                        <Card.Body style={{ height: '300px' }} className="p-3">
                            {isLoading
                                ? <div className="d-flex h-100 justify-content-center align-items-center"><Spinner /></div>
                                : <Doughnut ref={doughnutChartRef} data={doughnutData} options={doughnutOptions} />}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={8} className="mb-4">
                    <ChartCard title="Hasil Berdasarkan IPK" chartType="bar" chartData={stats.charts.ipk} icon={<GraphUp className="text-primary" />} />
                </Col>
            </Row>
            <Row>
                <Col lg={6} className="mb-4">
                    <ChartCard title="Hasil Berdasarkan Penghasilan Ortu" chartType="line" chartData={stats.charts.penghasilan} icon={<GraphUp className="text-info" />} />
                </Col>
                <Col lg={6} className="mb-4">
                    <Card className="shadow h-100 border-0">
                        <Card.Header as="h6" className="fw-semibold bg-light border-bottom-0 pt-2 pb-1 px-3 d-flex align-items-center text-truncate">
                            <Diagram3Fill className="text-secondary" /> <span className="ms-2 text-truncate">Proporsi Keaktifan Organisasi</span>
                        </Card.Header>
                        <Card.Body style={{ height: '300px' }} className="p-3">
                            {isLoading
                                ? <div className="d-flex h-100 justify-content-center align-items-center"><Spinner /></div>
                                : <Doughnut data={organisasiPieData} options={pieOptions} />}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col lg={6} className="mb-4">
                    <ChartCard title="Hasil Berdasarkan Jml. Tanggungan" chartType="bar" chartData={stats.charts.tanggungan} icon={<PeopleFill className="text-warning" />} />
                </Col>
                <Col lg={6} className="mb-4">
                    <Card className="shadow h-100 border-0">
                        <Card.Header as="h6" className="fw-semibold bg-light border-bottom-0 pt-2 pb-1 px-3 d-flex align-items-center text-truncate">
                            <PuzzleFill className="text-danger" /> <span className="ms-2 text-truncate">Keaktifan UKM</span>
                        </Card.Header>
                        <Card.Body style={{ height: '300px' }} className="p-3">
                            {isLoading
                                ? <div className="d-flex h-100 justify-content-center align-items-center"><Spinner /></div>
                                : <Bar data={ukmHorizontalBarData} options={horizontalBarOptions} />}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default DashboardPage;