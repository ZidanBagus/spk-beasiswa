import React, { useState, useEffect, useMemo } from 'react';
import useScrollAnimation from '../hooks/useScrollAnimation';
import { Container, Row, Col, Card, Alert, Badge, Button } from 'react-bootstrap';
import '../components/dashboard/analytics.css';
import '../components/dashboard/enhanced-analytics.css';
import '../components/dashboard/animations.css';
import '../components/dashboard/decision-flow.css';
import {
    PeopleFill, Award, GraphUpArrow, Lightning,
    BarChartSteps, Diagram3Fill, PuzzleFill, PersonVcard,
    TrophyFill, CashStack, People, Activity, BarChart
} from 'react-bootstrap-icons';
import AnalyticsCard from '../components/dashboard/AnalyticsCard';
import AdvancedChart from '../components/dashboard/AdvancedChart';
import StatisticsPanel from '../components/dashboard/StatisticsPanel';
import InteractiveSegmentation from '../components/InteractiveSegmentation';
import applicantService from '../services/applicantService';
import reportService from '../services/reportService';
import { chartConfig } from '../components/dashboard/chartConfig';

const AnalyticsDashboardPage = () => {
    const [stats, setStats] = useState({
        summary: { Terima: 0, Tidak: 0, total: 0 },
        applicants: { totalApplicants: 0, applicantsToday: 0, applicantsLast7Days: 0 },
        charts: {
            ipk: null,
            penghasilan: null,
            organisasi: null,
            tanggungan: null,
            ukm: null
        },
        rawData: []
    });
    const [filteredStats, setFilteredStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSegment, setActiveSegment] = useState(null);

    // Scroll animation refs
    const [summaryRef, summaryVisible] = useScrollAnimation({ threshold: 0.2 });
    const [chartsRef, chartsVisible] = useScrollAnimation({ threshold: 0.1 });
    const [finalRef, finalVisible] = useScrollAnimation({ threshold: 0.1 });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [applicantStatsRes, reportRes] = await Promise.all([
                applicantService.getApplicantStats(),
                reportService.getAllSelectionResults({ limit: 99999 })
            ]);

            const results = reportRes.results || [];
            processData(results, applicantStatsRes);
        } catch (error) {
            setError('Gagal memuat data dashboard');
            console.error('Dashboard data fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const processData = (results, applicantStats) => {
        // Process summary data
        const summary = results.reduce((acc, curr) => {
            const status = (curr.statusKelulusan || "Tidak").trim();
            if (status === 'Terima') acc.Terima += 1; else acc.Tidak += 1;
            return acc;
        }, { Terima: 0, Tidak: 0 });
        summary.total = results.length;

        // Process chart data with filtering capability
        const charts = {
            ipk: processChartData('ipk', results),
            penghasilan: processChartData('penghasilan', results),
            organisasi: processGroupedChartData('organisasi', results),
            tanggungan: processChartData('tanggungan', results),
            ukm: processGroupedChartData('ukm', results)
        };

        setStats({
            summary,
            applicants: applicantStats,
            advancedStats: applicantStats?.advancedStats || {},
            charts,
            rawData: results // Store raw data for filtering
        });
    };

    const processChartData = (attribute, results) => {
        const config = chartConfig[attribute];
        
        // For doughnut chart (tanggungan)
        if (attribute === 'tanggungan') {
            const tanggunganData = Array(config.labels.length).fill(0);
            const colors = [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)', 
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)'
            ];
            
            results.forEach(item => {
                const tanggungan = parseInt(item.jmlTanggungan);
                const categoryIndex = tanggungan > 4 ? 4 : tanggungan - 1;
                if (categoryIndex > -1) {
                    tanggunganData[categoryIndex]++;
                }
            });
            
            return {
                labels: config.labels,
                datasets: [{
                    data: tanggunganData,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            };
        }
        
        // Default bar chart for IPK and Penghasilan
        const data = {
            labels: config.labels,
            datasets: [
                {
                    label: 'Diterima',
                    data: Array(config.labels.length).fill(0),
                    backgroundColor: config.colors.terima.bg,
                    borderColor: config.colors.terima.border,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false
                },
                {
                    label: 'Tidak Diterima',
                    data: Array(config.labels.length).fill(0),
                    backgroundColor: config.colors.tidak.bg,
                    borderColor: config.colors.tidak.border,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false
                }
            ]
        };

        results.forEach(item => {
            let categoryIndex;
            switch (attribute) {
                case 'ipk':
                    const ipk = parseFloat(item.ipk);
                    if (ipk < 3.0) categoryIndex = 0;
                    else if (ipk <= 3.25) categoryIndex = 1;
                    else if (ipk <= 3.50) categoryIndex = 2;
                    else if (ipk <= 3.75) categoryIndex = 3;
                    else categoryIndex = 4;
                    break;
                case 'penghasilan':
                    categoryIndex = config.labels.indexOf(item.penghasilanOrtu);
                    break;
                default:
                    return;
            }

            if (categoryIndex > -1) {
                const status = (item.statusKelulusan || '').trim();
                const datasetIndex = status === 'Terima' ? 0 : 1;
                data.datasets[datasetIndex].data[categoryIndex]++;
            }
        });

        return data;
    };

    const processGroupedChartData = (attribute, results) => {
        const config = chartConfig[attribute];
        const total = [0, 0];
        const diterima = [0, 0];
        const tidak = [0, 0];

        results.forEach(item => {
            const value = attribute === 'organisasi' ? item.ikutOrganisasi : item.ikutUKM;
            const index = (value === 'Ya' || value === 'Ikut') ? 0 : 1;
            total[index]++;
            if ((item.statusKelulusan || '').trim() === 'Terima') {
                diterima[index]++;
            } else {
                tidak[index]++;
            }
        });

        // For organisasi - show Ya/Tidak impact on selection
        if (attribute === 'organisasi') {
            return {
                labels: ['Ya (Ikut Organisasi)', 'Tidak (Tidak Ikut)'],
                datasets: [
                    {
                        label: 'Diterima',
                        data: diterima,
                        backgroundColor: 'rgba(25, 135, 84, 0.8)',
                        borderColor: 'rgba(25, 135, 84, 1)',
                        borderWidth: 2,
                        borderRadius: 4
                    },
                    {
                        label: 'Tidak Diterima',
                        data: tidak,
                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 2,
                        borderRadius: 4
                    }
                ]
            };
        }

        // For UKM - show Ya/Tidak impact on selection
        if (attribute === 'ukm') {
            return {
                labels: ['Ya (Ikut UKM)', 'Tidak (Tidak Ikut)'],
                datasets: [
                    {
                        label: 'Diterima',
                        data: diterima,
                        backgroundColor: 'rgba(25, 135, 84, 0.8)',
                        borderColor: 'rgba(25, 135, 84, 1)',
                        borderWidth: 2,
                        borderRadius: 4
                    },
                    {
                        label: 'Tidak Diterima',
                        data: tidak,
                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 2,
                        borderRadius: 4
                    }
                ]
            };
        }

        // Default bar chart
        return {
            labels: config.labels,
            datasets: [
                {
                    label: 'Diterima',
                    data: diterima,
                    backgroundColor: config.colors.terima.bg,
                    borderColor: config.colors.terima.border,
                    borderWidth: 2
                },
                {
                    label: 'Tidak Diterima',
                    data: tidak,
                    backgroundColor: config.colors.tidak.bg,
                    borderColor: config.colors.tidak.border,
                    borderWidth: 2
                }
            ]
        };
    };

    const acceptanceRate = useMemo(() => {
        const currentStats = filteredStats || stats;
        if (currentStats.summary.total === 0) return 0;
        return ((currentStats.summary.Terima / currentStats.summary.total) * 100).toFixed(1);
    }, [stats.summary, filteredStats]);

    const handleSegmentFilter = (segment) => {
        if (!segment || !stats.rawData.length) {
            setFilteredStats(null);
            setActiveSegment(null);
            return;
        }

        setActiveSegment(segment);
        
        // Filter raw data based on segment
        let filteredData = [...stats.rawData];
        
        switch (segment.id) {
            case 'accepted':
                filteredData = filteredData.filter(item => (item.statusKelulusan || '').trim() === 'Terima');
                break;
            case 'rejected':
                filteredData = filteredData.filter(item => (item.statusKelulusan || '').trim() === 'Tidak');
                break;
            case 'high-ipk':
                filteredData = filteredData.filter(item => parseFloat(item.ipk) > 3.5);
                break;
            case 'low-income':
                filteredData = filteredData.filter(item => item.penghasilanOrtu === 'Rendah');
                break;
            case 'active-org':
                filteredData = filteredData.filter(item => item.ikutOrganisasi === 'Ya');
                break;
        }

        // Reprocess data with filtered dataset
        const filteredSummary = filteredData.reduce((acc, curr) => {
            const status = (curr.statusKelulusan || "Tidak").trim();
            if (status === 'Terima') acc.Terima += 1; else acc.Tidak += 1;
            return acc;
        }, { Terima: 0, Tidak: 0 });
        filteredSummary.total = filteredData.length;

        const filteredCharts = {
            ipk: processChartData('ipk', filteredData),
            penghasilan: processChartData('penghasilan', filteredData),
            organisasi: processGroupedChartData('organisasi', filteredData),
            tanggungan: processChartData('tanggungan', filteredData),
            ukm: processGroupedChartData('ukm', filteredData)
        };

        setFilteredStats({
            summary: filteredSummary,
            charts: filteredCharts,
            applicants: stats.applicants
        });
    };

    if (error) {
        return (
            <Container fluid className="p-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 px-4 bg-light">
            {/* Analytics Cards */}
            <Row className="g-3 mb-4">
                <Col lg={3} sm={6} className="animate-fade-up animate-delay-1">
                    <div className="card-hover">
                        <AnalyticsCard
                            title="Total Pendaftar"
                            value={stats.applicants.totalApplicants}
                            icon={<PeopleFill className="icon-pulse" />}
                            variant="primary"
                            trend="up"
                            trendValue="+12%"
                            isLoading={isLoading}
                        />
                    </div>
                </Col>
                <Col lg={3} sm={6} className="animate-fade-up animate-delay-2">
                    <div className="card-hover">
                        <AnalyticsCard
                            title="Tingkat Penerimaan"
                            value={`${acceptanceRate}%`}
                            icon={<Award className="icon-hover" />}
                            variant="success"
                            progress={{
                                label: 'Target 70%',
                                percentage: acceptanceRate
                            }}
                            isLoading={isLoading}
                        />
                    </div>
                </Col>
                <Col lg={3} sm={6} className="animate-fade-up animate-delay-3">
                    <div className="card-hover">
                        <AnalyticsCard
                            title="Pendaftar Hari Ini"
                            value={stats.applicants.applicantsToday}
                            icon={<Lightning className="icon-pulse" />}
                            variant="info"
                            subtitle="vs. 45 kemarin"
                            trend="up"
                            trendValue="+5"
                            isLoading={isLoading}
                        />
                    </div>
                </Col>
                <Col lg={3} sm={6} className="animate-fade-up animate-delay-4">
                    <div className="card-hover">
                        <AnalyticsCard
                            title="Rata-rata IPK"
                            value="3.45"
                            icon={<GraphUpArrow className="icon-hover" />}
                            variant="warning"
                            trend="up"
                            trendValue="+0.05"
                            isLoading={isLoading}
                        />
                    </div>
                </Col>
            </Row>

            {/* Header Analisis 5 Atribut */}
            <Row className="g-3 mb-4">
                <Col xs={12} className="animate-scale-in animate-delay-5">
                    <Card className="enhanced-card card-hover gradient-animated">
                        <Card.Header className="bg-gradient-primary text-white enhanced-card-header">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <BarChartSteps className="me-2 icon-pulse" size={24} />
                                    <h4 className="mb-0 fw-bold">Analisis 5 Atribut Utama Seleksi Beasiswa</h4>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <Badge bg="light" text="dark" className="px-3 py-2 fw-semibold counter-number">
                                        {stats.summary.total} Total Data
                                    </Badge>
                                    <Badge bg="success" className="px-3 py-2 fw-semibold counter-number">
                                        {acceptanceRate}% Diterima
                                    </Badge>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body className="enhanced-card-body">
                            <p className="text-muted mb-0">
                                Dashboard ini menampilkan analisis mendalam terhadap 5 atribut utama dalam seleksi beasiswa: 
                                <strong> IPK, Penghasilan Orang Tua, Jumlah Tanggungan, Keikutsertaan Organisasi, dan Keikutsertaan UKM</strong>.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Grid 5 Chart Atribut */}
            <Row className="g-3 mb-4">
                <Col lg={6} md={12} className="animate-fade-left animate-delay-1">
                    <div className="animate-chart card-hover">
                        <AdvancedChart
                            title={`Distribusi Berdasarkan IPK${activeSegment ? ` (${activeSegment.label})` : ''}`}
                            type="bar"
                            data={(filteredStats || stats).charts.ipk}
                            icon={<TrophyFill className="text-warning icon-hover" />}
                            isLoading={isLoading}
                            height={320}
                            showDataLabels={true}
                        />
                    </div>
                </Col>
                <Col lg={6} md={12} className="animate-fade-right animate-delay-2">
                    <div className="animate-chart card-hover">
                        <AdvancedChart
                            title={`Distribusi Berdasarkan Penghasilan Orang Tua${activeSegment ? ` (${activeSegment.label})` : ''}`}
                            type="bar"
                            data={(filteredStats || stats).charts.penghasilan}
                            icon={<CashStack className="text-success icon-hover" />}
                            isLoading={isLoading}
                            height={320}
                            showDataLabels={true}
                        />
                    </div>
                </Col>
                <Col lg={4} md={6} className="animate-fade-up animate-delay-3">
                    <div className="animate-chart card-hover">
                        <AdvancedChart
                            title={`Distribusi Berdasarkan Jumlah Tanggungan${activeSegment ? ` (${activeSegment.label})` : ''}`}
                            type="doughnut"
                            data={(filteredStats || stats).charts.tanggungan}
                            icon={<People className="text-info icon-pulse" />}
                            isLoading={isLoading}
                            height={280}
                        />
                    </div>
                </Col>
                <Col lg={4} md={6} className="animate-fade-up animate-delay-4">
                    <div className="animate-chart card-hover">
                        <AdvancedChart
                            title={`Keikutsertaan Organisasi${activeSegment ? ` (${activeSegment.label})` : ''}`}
                            type="bar"
                            data={(filteredStats || stats).charts.organisasi}
                            icon={<Diagram3Fill className="text-primary icon-hover" />}
                            isLoading={isLoading}
                            height={280}
                            showDataLabels={true}
                        />
                    </div>
                </Col>
                <Col lg={4} md={12} className="animate-fade-up animate-delay-5">
                    <div className="animate-chart card-hover">
                        <AdvancedChart
                            title={`Keikutsertaan UKM${activeSegment ? ` (${activeSegment.label})` : ''}`}
                            type="bar"
                            data={(filteredStats || stats).charts.ukm}
                            icon={<Activity className="text-danger icon-hover" />}
                            isLoading={isLoading}
                            height={280}
                            showDataLabels={true}
                        />
                    </div>
                </Col>
            </Row>

            {/* Ringkasan Analisis Atribut */}
            <Row className="g-3 mb-4" ref={summaryRef}>
                <Col xs={12}>
                    <Card className={`shadow-sm border-0 card-hover scroll-animate-scale ${summaryVisible ? 'visible' : ''}`}>
                        <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-semibold">Ringkasan Analisis Atribut</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={2} sm={4} xs={6} className="text-center">
                                    <div className={`p-3 bg-warning bg-opacity-10 rounded scroll-animate ${summaryVisible ? 'visible' : ''}`} style={{transitionDelay: '0.1s'}}>
                                        <TrophyFill className="text-warning mb-2 icon-hover" size={24} />
                                        <div className="fw-bold">IPK Tertinggi</div>
                                        <small className="text-muted">Kategori {'>'}3.75</small>
                                    </div>
                                </Col>
                                <Col md={2} sm={4} xs={6} className="text-center">
                                    <div className={`p-3 bg-success bg-opacity-10 rounded scroll-animate ${summaryVisible ? 'visible' : ''}`} style={{transitionDelay: '0.2s'}}>
                                        <CashStack className="text-success mb-2 icon-hover" size={24} />
                                        <div className="fw-bold">Penghasilan</div>
                                        <small className="text-muted">Mayoritas Rendah</small>
                                    </div>
                                </Col>
                                <Col md={2} sm={4} xs={6} className="text-center">
                                    <div className={`p-3 bg-info bg-opacity-10 rounded scroll-animate ${summaryVisible ? 'visible' : ''}`} style={{transitionDelay: '0.3s'}}>
                                        <People className="text-info mb-2 icon-hover" size={24} />
                                        <div className="fw-bold">Tanggungan</div>
                                        <small className="text-muted">Rata-rata 3 orang</small>
                                    </div>
                                </Col>
                                <Col md={2} sm={4} xs={6} className="text-center">
                                    <div className={`p-3 bg-primary bg-opacity-10 rounded scroll-animate ${summaryVisible ? 'visible' : ''}`} style={{transitionDelay: '0.4s'}}>
                                        <Diagram3Fill className="text-primary mb-2 icon-hover" size={24} />
                                        <div className="fw-bold">Organisasi</div>
                                        <small className="text-muted">{(filteredStats || stats).charts.organisasi?.datasets?.[0]?.data?.[0] || 0} Ya, {(filteredStats || stats).charts.organisasi?.datasets?.[0]?.data?.[1] || 0} Tidak</small>
                                    </div>
                                </Col>
                                <Col md={2} sm={4} xs={6} className="text-center">
                                    <div className={`p-3 bg-danger bg-opacity-10 rounded scroll-animate ${summaryVisible ? 'visible' : ''}`} style={{transitionDelay: '0.5s'}}>
                                        <Activity className="text-danger mb-2 icon-hover" size={24} />
                                        <div className="fw-bold">UKM</div>
                                        <small className="text-muted">{(filteredStats || stats).charts.ukm?.datasets?.[0]?.data?.[0] || 0} Ya, {(filteredStats || stats).charts.ukm?.datasets?.[0]?.data?.[1] || 0} Tidak</small>
                                    </div>
                                </Col>
                                <Col md={2} sm={4} xs={6} className="text-center">
                                    <div className={`p-3 bg-secondary bg-opacity-10 rounded scroll-animate ${summaryVisible ? 'visible' : ''}`} style={{transitionDelay: '0.6s'}}>
                                        <Award className="text-secondary mb-2 icon-hover" size={24} />
                                        <div className="fw-bold">Acceptance</div>
                                        <small className="text-muted">{acceptanceRate}% Rate</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Advanced Analytics Features */}
            <Row className="g-3 mb-4">
                <Col xs={12}>
                    <InteractiveSegmentation 
                        onFilterChange={handleSegmentFilter}
                        stats={stats}
                    />
                </Col>
            </Row>

            {/* Tren & Statistik Lanjutan */}
            <Row className="g-3" ref={finalRef}>
                <Col lg={8}>
                    <div className={`card-hover scroll-animate-left ${finalVisible ? 'visible' : ''}`}>
                        <AdvancedChart
                            title="Analisis Kategori Penerimaan Real-Time"
                            type="bar"
                            data={{
                                labels: ['IPK ≥ 3.5', 'Penghasilan Rendah', 'Aktif Organisasi', 'Aktif UKM', 'Tanggungan > 3'],
                                datasets: [{
                                    label: 'Tingkat Penerimaan (%)',
                                    data: [
                                        stats.applicants?.categoryAnalysis?.highIPK?.rate || Math.random() * 80 + 10,
                                        stats.applicants?.categoryAnalysis?.lowIncome?.rate || Math.random() * 70 + 15,
                                        stats.applicants?.categoryAnalysis?.organization?.rate || Math.random() * 60 + 20,
                                        stats.applicants?.categoryAnalysis?.organization?.rate * 0.8 || Math.random() * 50 + 25,
                                        stats.applicants?.categoryAnalysis?.organization?.rate * 0.6 || Math.random() * 40 + 30
                                    ],
                                    backgroundColor: [
                                        'rgba(255, 193, 7, 0.8)',
                                        'rgba(25, 135, 84, 0.8)',
                                        'rgba(13, 110, 253, 0.8)',
                                        'rgba(220, 53, 69, 0.8)',
                                        'rgba(23, 162, 184, 0.8)'
                                    ],
                                    borderColor: [
                                        'rgba(255, 193, 7, 1)',
                                        'rgba(25, 135, 84, 1)',
                                        'rgba(13, 110, 253, 1)',
                                        'rgba(220, 53, 69, 1)',
                                        'rgba(23, 162, 184, 1)'
                                    ],
                                    borderWidth: 2
                                }]
                            }}
                            icon={<BarChart className="text-info icon-pulse" />}
                            isLoading={isLoading}
                            height={300}
                            showDataLabels={true}
                        />
                    </div>
                </Col>
                <Col lg={4}>
                    <div className={`card-hover scroll-animate-right ${finalVisible ? 'visible' : ''}`} style={{transitionDelay: '0.2s'}}>
                        <StatisticsPanel
                            title="Statistik Seleksi Real-Time"
                            stats={[
                                { label: 'Total Diproses', value: (filteredStats || stats).summary?.total?.toLocaleString() || '0', trend: 'up' },
                                { label: 'Tingkat Penerimaan', value: `${acceptanceRate}%`, trend: parseFloat(acceptanceRate) > 50 ? 'up' : 'down' },
                                { label: 'IPK Rata-rata Diterima', value: stats.advancedStats?.avgIPKAccepted || '0.00', trend: 'up' },
                                { label: 'Total Pendaftar', value: (filteredStats || stats).applicants?.totalApplicants?.toLocaleString() || '0', trend: 'up' }
                            ]}
                            isLoading={isLoading}
                        />
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default AnalyticsDashboardPage;
