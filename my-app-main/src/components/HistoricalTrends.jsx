import React from 'react';
import { Line } from 'react-chartjs-2';
import { Card } from 'react-bootstrap';
import { TrendingUp } from 'react-bootstrap-icons';

const HistoricalTrends = ({ isLoading }) => {
    // Mock historical data - replace with real data from backend
    const trendData = {
        labels: ['2021', '2022', '2023', '2024'],
        datasets: [
            {
                label: 'Jumlah Pendaftar',
                data: [120, 150, 180, 200],
                borderColor: 'rgb(13, 110, 253)',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                yAxisID: 'y',
                tension: 0.4
            },
            {
                label: 'Rata-rata IPK',
                data: [3.2, 3.35, 3.4, 3.45],
                borderColor: 'rgb(25, 135, 84)',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                yAxisID: 'y1',
                tension: 0.4
            },
            {
                label: 'Tingkat Penerimaan (%)',
                data: [60, 65, 68, 70],
                borderColor: 'rgb(255, 193, 7)',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                yAxisID: 'y2',
                tension: 0.4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false,
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Tahun'
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Jumlah Pendaftar'
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'IPK'
                },
                grid: {
                    drawOnChartArea: false,
                },
                min: 3.0,
                max: 4.0
            },
            y2: {
                type: 'linear',
                display: false,
                min: 0,
                max: 100
            }
        },
    };

    if (isLoading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <TrendingUp className="me-2" />
                        Tren Historis (2021-2024)
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
                    <TrendingUp className="me-2" />
                    Tren Historis (2021-2024)
                </h6>
                <small className="text-muted">Perbandingan metrik kunci dari tahun ke tahun</small>
            </Card.Header>
            <Card.Body>
                <div style={{ height: '300px' }}>
                    <Line data={trendData} options={options} />
                </div>
                <div className="mt-3 row text-center">
                    <div className="col-4">
                        <div className="text-primary fw-bold">+67%</div>
                        <small className="text-muted">Pertumbuhan Pendaftar</small>
                    </div>
                    <div className="col-4">
                        <div className="text-success fw-bold">+0.25</div>
                        <small className="text-muted">Peningkatan IPK</small>
                    </div>
                    <div className="col-4">
                        <div className="text-warning fw-bold">+10%</div>
                        <small className="text-muted">Tingkat Penerimaan</small>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default HistoricalTrends;