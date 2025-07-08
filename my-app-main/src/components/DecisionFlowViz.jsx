import React, { useState, useEffect } from 'react';
import { Card, Alert } from 'react-bootstrap';
import { Diagram2 } from 'react-bootstrap-icons';
import axios from 'axios';

const DecisionFlowViz = ({ isLoading }) => {
    const [flowData, setFlowData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDecisionFlowData();
    }, []);

    const fetchDecisionFlowData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/selection/decision-flow');
            setFlowData(response.data);
        } catch (err) {
            setError('Gagal memuat data alur keputusan');
            console.error('Decision flow fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderDecisionTree = (node, level = 0, parentPath = '') => {
        if (!node) return null;

        const currentPath = parentPath ? `${parentPath} → ${node.name}` : node.name;
        const isLeaf = !node.children || node.children.length === 0;
        
        return (
            <div key={currentPath} className={`decision-node level-${level}`} style={{ marginLeft: `${level * 20}px` }}>
                <div className={`node-content p-2 mb-2 rounded border ${isLeaf ? 'bg-light' : 'bg-primary bg-opacity-10'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <strong className={isLeaf ? 'text-success' : 'text-primary'}>
                                {node.name}
                            </strong>
                            {node.condition && (
                                <div className="small text-muted">{node.condition}</div>
                            )}
                        </div>
                        <div className="text-end">
                            <div className="fw-bold">{node.value || node.count}</div>
                            <div className="small text-muted">
                                {node.percentage ? `${node.percentage}%` : 'pendaftar'}
                            </div>
                        </div>
                    </div>
                    
                    {isLeaf && node.result && (
                        <div className={`mt-2 p-2 rounded ${node.result === 'DITERIMA' ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'}`}>
                            <small className="fw-bold">
                                Hasil: {node.result} ({node.accuracy}% akurasi)
                            </small>
                        </div>
                    )}
                </div>
                
                {node.children && node.children.map(child => 
                    renderDecisionTree(child, level + 1, currentPath)
                )}
            </div>
        );
    };

    const renderFlowSummary = () => {
        if (!flowData?.summary) return null;

        return (
            <div className="row text-center mb-3">
                <div className="col-3">
                    <div className="text-primary fw-bold h6">{flowData.summary.totalPaths}</div>
                    <small className="text-muted">Total Jalur</small>
                </div>
                <div className="col-3">
                    <div className="text-success fw-bold h6">{flowData.summary.mostCommonPath?.count || 0}</div>
                    <small className="text-muted">Jalur Terpopuler</small>
                </div>
                <div className="col-3">
                    <div className="text-warning fw-bold h6">{flowData.summary.avgDepth?.toFixed(1) || 0}</div>
                    <small className="text-muted">Kedalaman Rata-rata</small>
                </div>
                <div className="col-3">
                    <div className="text-info fw-bold h6">{flowData.summary.leafNodes || 0}</div>
                    <small className="text-muted">Node Akhir</small>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <Diagram2 className="me-2" />
                        Visualisasi Alur Keputusan
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
            <Card.Header className="bg-warning text-dark">
                <h6 className="mb-0">
                    <Diagram2 className="me-2" />
                    Visualisasi Alur Keputusan C4.5
                </h6>
                <small>Jalur keputusan yang paling sering dilewati pendaftar</small>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-warning" />
                        <div className="mt-2">Membangun pohon keputusan...</div>
                    </div>
                ) : (
                    <>
                        {renderFlowSummary()}
                        
                        <div className="decision-tree-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {flowData?.tree ? (
                                renderDecisionTree(flowData.tree)
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <Diagram2 size={48} className="mb-3" />
                                    <div>Belum ada data pohon keputusan</div>
                                    <small>Lakukan proses seleksi terlebih dahulu</small>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {flowData && (
                    <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted">
                            🌳 <strong>Insight:</strong> Pohon keputusan memiliki {flowData.summary?.totalPaths || 0} jalur unik. 
                            Jalur terpopuler: "{flowData.summary?.mostCommonPath?.path || 'N/A'}" 
                            dengan {flowData.summary?.mostCommonPath?.count || 0} pendaftar.
                        </small>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default DecisionFlowViz;