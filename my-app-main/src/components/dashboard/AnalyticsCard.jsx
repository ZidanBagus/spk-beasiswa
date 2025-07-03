import React from 'react';
import { Card, Badge, ProgressBar } from 'react-bootstrap';
import { ArrowUpShort, ArrowDownShort, Dash } from 'react-bootstrap-icons';

const AnalyticsCard = ({ 
    title, 
    value, 
    icon, 
    variant = 'primary', 
    trend = null, 
    trendValue = null,
    subtitle = null,
    progress = null,
    isLoading = false 
}) => {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') return <ArrowUpShort className="text-success" size={16} />;
        if (trend === 'down') return <ArrowDownShort className="text-danger" size={16} />;
        return <Dash className="text-muted" size={16} />;
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'success';
        if (trend === 'down') return 'danger';
        return 'secondary';
    };

    return (
        <Card className="h-100 shadow-sm border-0 analytics-card">
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className={`p-2 rounded-circle bg-${variant} bg-opacity-10`}>
                        <div className={`text-${variant} fs-4`}>{icon}</div>
                    </div>
                    {trend && (
                        <Badge bg={getTrendColor()} className="d-flex align-items-center gap-1">
                            {getTrendIcon()}
                            {trendValue}
                        </Badge>
                    )}
                </div>
                
                <div className="mb-1">
                    <h3 className="fw-bold mb-0 text-dark">
                        {isLoading ? (
                            <div className="placeholder-glow">
                                <span className="placeholder col-4"></span>
                            </div>
                        ) : (
                            value
                        )}
                    </h3>
                    <p className="text-muted small mb-0 fw-medium">{title}</p>
                </div>

                {subtitle && (
                    <p className="text-muted small mb-2">{subtitle}</p>
                )}

                {progress && (
                    <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">{progress.label}</small>
                            <small className="fw-bold">{progress.percentage}%</small>
                        </div>
                        <ProgressBar 
                            variant={variant} 
                            now={progress.percentage} 
                            style={{ height: '4px' }}
                        />
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default AnalyticsCard;
