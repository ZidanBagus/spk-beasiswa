import React, { useMemo } from 'react';
import { Card, Spinner, Badge } from 'react-bootstrap';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler,
    ChartDataLabels
);

const AdvancedChart = ({ 
    title, 
    type = 'bar', 
    data, 
    icon, 
    isLoading = false,
    height = 300,
    showDataLabels = false,
    customOptions = {}
}) => {
    const chartOptions = useMemo(() => {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                },
                datalabels: {
                    display: showDataLabels,
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    formatter: (value) => value > 0 ? value : ''
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            }
        };

        // Chart-specific options
        switch (type) {
            case 'doughnut':
                return {
                    ...baseOptions,
                    plugins: {
                        ...baseOptions.plugins,
                        legend: {
                            position: 'right',
                            labels: {
                                font: { size: 12 },
                                padding: 20,
                                usePointStyle: true
                            }
                        },
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
                    },
                    cutout: '60%'
                };

            case 'radar':
                return {
                    ...baseOptions,
                    scales: {
                        r: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            pointLabels: {
                                font: { size: 11 }
                            },
                            ticks: {
                                font: { size: 10 }
                            }
                        }
                    },
                    elements: {
                        line: {
                            borderWidth: 2
                        },
                        point: {
                            radius: 4,
                            hoverRadius: 6
                        }
                    }
                };

            case 'line':
                return {
                    ...baseOptions,
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        }
                    },
                    elements: {
                        line: {
                            tension: 0.4,
                            borderWidth: 3
                        },
                        point: {
                            radius: 4,
                            hoverRadius: 8,
                            borderWidth: 2
                        }
                    }
                };

            default: // bar
                return {
                    ...baseOptions,
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        }
                    },
                    borderRadius: 4,
                    borderSkipped: false
                };
        }
    }, [type, showDataLabels]);

    const mergedOptions = useMemo(() => ({
        ...chartOptions,
        ...customOptions
    }), [chartOptions, customOptions]);

    const renderChart = () => {
        if (isLoading) {
            return (
                <div className="d-flex justify-content-center align-items-center h-100">
                    <Spinner animation="border" variant="primary" />
                </div>
            );
        }

        const chartProps = {
            data,
            options: mergedOptions
        };

        switch (type) {
            case 'doughnut':
                return <Doughnut {...chartProps} />;
            case 'line':
                return <Line {...chartProps} />;
            case 'radar':
                return <Radar {...chartProps} />;
            default:
                return <Bar {...chartProps} />;
        }
    };

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-bottom-0 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        {icon && <div className="me-2 text-primary">{icon}</div>}
                        <h6 className="mb-0 fw-semibold text-dark">{title}</h6>
                    </div>
                    <Badge bg="light" text="dark" className="text-uppercase small">
                        {type}
                    </Badge>
                </div>
            </Card.Header>
            <Card.Body style={{ height: `${height}px` }} className="pt-2">
                {renderChart()}
            </Card.Body>
        </Card>
    );
};

export default AdvancedChart;
