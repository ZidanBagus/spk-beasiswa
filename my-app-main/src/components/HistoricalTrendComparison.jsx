import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { GraphUp } from 'react-bootstrap-icons';
import reportService from '../services/reportService';

const HistoricalTrendComparison = ({ isLoading }) => {
    const [trendData, setTrendData] = useState(null);
    const [batchStats, setBatchStats] = useState({ current: 0, previous: 0, growth: 0 });
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        fetchBatchTrendData();
    }, []);

    const fetchBatchTrendData = async () => {
        try {
            // Import batch history service
            const { default: batchHistoryService } = await import('../services/batchHistoryService');
            
            // Fetch current selection results
            const response = await reportService.getAllSelectionResults({ limit: 99999 });
            const results = response.results || [];
            
            // Save current batch to history if there are results
            if (results.length > 0) {
                const currentBatchData = {
                    totalApplicants: results.length,
                    accepted: results.filter(item => (item.statusKelulusan || '').trim() === 'Terima').length,
                    rejected: results.filter(item => (item.statusKelulusan || '').trim() === 'Tidak').length
                };
                batchHistoryService.saveBatchResult(currentBatchData);
            }
            
            // Get batch history and create chart data
            const batchData = processBatchHistoryData(batchHistoryService);
            setTrendData(batchData.chartData);
            setBatchStats(batchData.stats);
        } catch (error) {
            console.error('Error fetching batch trend data:', error);
            setMockData();
        } finally {
            setDataLoading(false);
        }
    };

    const processBatchHistoryData = (batchHistoryService) => {
        const history = batchHistoryService.getBatchHistory();
        const comparisonStats = batchHistoryService.getComparisonStats();
        
        if (history.length === 0) {
            return {
                chartData: {
                    labels: ['Belum Ada Data'],
                    datasets: [{
                        label: 'Tidak Ada Batch',
                        data: [0],
                        borderColor: 'rgb(108, 117, 125)',
                        backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        tension: 0.4,
                        borderWidth: 2
                    }]
                },
                stats: { current: 0, previous: 0, growth: 0, singleBatch: true }
            };
        }

        // Create chart data from batch history
        const labels = history.map((batch, index) => `Batch ${index + 1} (${batch.date})`);
        const applicantData = history.map(batch => batch.totalApplicants);
        const acceptedData = history.map(batch => batch.accepted);
        
        return {
            chartData: {
                labels,
                datasets: [
                    {
                        label: 'Total Pendaftar',
                        data: applicantData,
                        borderColor: 'rgb(13, 110, 253)',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        fill: true
                    },
                    {
                        label: 'Diterima',
                        data: acceptedData,
                        borderColor: 'rgb(25, 135, 84)',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        fill: false
                    }
                ]
            },
            stats: {
                current: comparisonStats.current,
                previous: comparisonStats.previous,
                growth: comparisonStats.growth,
                singleBatch: !comparisonStats.hasComparison,
                totalBatches: history.length
            }
        };
    };

    const processBatchData = (results) => {
        // Group by month-year from createdAt or use current date as fallback
        const monthlyData = {};
        const batchData = {};
        
        results.forEach(item => {
            const date = new Date(item.createdAt || item.tanggalDaftar || Date.now());
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const batchKey = `Batch-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { total: 0, accepted: 0 };
            }
            if (!batchData[batchKey]) {
                batchData[batchKey] = { total: 0, accepted: 0, month: date.getMonth(), year: date.getFullYear() };
            }
            
            monthlyData[monthKey].total++;
            batchData[batchKey].total++;
            if ((item.statusKelulusan || '').trim() === 'Terima') {
                monthlyData[monthKey].accepted++;
                batchData[batchKey].accepted++;
            }
        });

        // Get available batches and sort by date
        const availableBatches = Object.keys(batchData).sort();
        
        if (availableBatches.length === 0) {
            // No data available, return mock data
            return {
                chartData: {
                    labels: ['Batch 1', 'Batch 2', 'Batch 3'],
                    datasets: [{
                        label: 'Tidak Ada Data',
                        data: [0, 0, 0],
                        borderColor: 'rgb(108, 117, 125)',
                        backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        tension: 0.4,
                        borderWidth: 2
                    }]
                },
                stats: { current: 0, previous: 0, growth: 0 }
            };
        }

        // If we have multiple batches, compare them
        if (availableBatches.length >= 2) {
            const latestBatch = availableBatches[availableBatches.length - 1];
            const previousBatch = availableBatches[availableBatches.length - 2];
            
            const currentTotal = batchData[latestBatch].total;
            const previousTotal = batchData[previousBatch].total;
            const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : 0;
            
            return {
                chartData: {
                    labels: availableBatches.map(batch => {
                        const batchInfo = batchData[batch];
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                        return `${months[batchInfo.month]} ${batchInfo.year}`;
                    }),
                    datasets: [{
                        label: 'Jumlah Pendaftar per Batch',
                        data: availableBatches.map(batch => batchData[batch].total),
                        borderColor: 'rgb(13, 110, 253)',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        fill: true
                    }]
                },
                stats: { current: currentTotal, previous: previousTotal, growth }
            };
        } else {
            // Only one batch available, show current data only
            const onlyBatch = availableBatches[0];
            const currentTotal = batchData[onlyBatch].total;
            
            return {
                chartData: {
                    labels: ['Batch Saat Ini'],
                    datasets: [{
                        label: 'Jumlah Pendaftar',
                        data: [currentTotal],
                        borderColor: 'rgb(13, 110, 253)',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4,
                        borderWidth: 3
                    }]
                },
                stats: { current: currentTotal, previous: 0, growth: 0, singleBatch: true }
            };
        }
    };

    const setMockData = () => {
        setTrendData({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
            datasets: [
                {
                    label: 'Periode Saat Ini (2024)',
                    data: [45, 52, 48, 61, 55, 67],
                    borderColor: 'rgb(13, 110, 253)',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: 'Periode Sebelumnya (2023)',
                    data: [38, 45, 42, 48, 44, 52],
                    borderColor: 'rgb(108, 117, 125)',
                    backgroundColor: 'rgba(108, 117, 125, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    borderDash: [5, 5]
                }
            ]
        });
        setBatchStats({ current: 328, previous: 269, growth: 21.9 });
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Bulan'
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Jumlah Pendaftar'
                },
                beginAtZero: true
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    if (isLoading || dataLoading || !trendData) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <GraphUp className="me-2" />
                        Riwayat Batch Seleksi
                    </h6>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header>
                <h6 className="mb-0">
                    <GraphUp className="me-2" />
                    Riwayat Batch Seleksi
                </h6>
                <small className="text-muted">Perbandingan hasil batch seleksi dari waktu ke waktu</small>
            </Card.Header>
            <Card.Body>
                <div style={{ height: '250px' }} className="mb-3">
                    <Line data={trendData} options={options} />
                </div>
                
                <Row className="text-center">
                    <Col xs={4}>
                        <div className="border-end">
                            <div className="text-primary fw-bold h5">{batchStats.current}</div>
                            <small className="text-muted">Periode Saat Ini</small>
                        </div>
                    </Col>
                    <Col xs={4}>
                        <div className="border-end">
                            <div className="text-secondary fw-bold h5">{batchStats.previous}</div>
                            <small className="text-muted">Periode Sebelumnya</small>
                        </div>
                    </Col>
                    <Col xs={4}>
                        <div>
                            <div className={`fw-bold h5 ${batchStats.growth > 0 ? 'text-success' : 'text-danger'}`}>
                                {batchStats.growth > 0 ? '+' : ''}{batchStats.growth}%
                            </div>
                            <small className="text-muted">Pertumbuhan</small>
                        </div>
                    </Col>
                </Row>

                <div className="mt-3 p-2 bg-light rounded">
                    <small className="text-muted">
                        📈 <strong>Insight:</strong> 
                        {batchStats.singleBatch 
                            ? `Tersimpan ${batchStats.current} pendaftar pada batch seleksi saat ini. History batch akan terakumulasi setiap kali proses seleksi dilakukan.`
                            : `Dari ${batchStats.totalBatches} batch yang tersimpan, tren pendaftaran ${batchStats.growth > 0 ? 'meningkat' : batchStats.growth < 0 ? 'menurun' : 'stabil'} ${Math.abs(batchStats.growth)}% dibanding batch sebelumnya.`
                        }
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
};

export default HistoricalTrendComparison;