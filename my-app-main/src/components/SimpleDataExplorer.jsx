import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Table, Badge } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import reportService from '../services/reportService';

const SimpleDataExplorer = ({ isLoading }) => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [data, searchTerm, statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await reportService.getAllSelectionResults({ limit: 100 });
            const results = response.results || [];
            setData(results);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...data];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => 
                (item.statusKelulusan || '').trim() === statusFilter
            );
        }

        if (searchTerm) {
            filtered = filtered.filter(item =>
                (item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.nim || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredData(filtered);
    };

    if (isLoading || loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <Search className="me-2" />
                        Data Explorer
                    </h6>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-warning" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header className="bg-warning text-dark">
                <h6 className="mb-0">
                    <Search className="me-2" />
                    Data Explorer
                </h6>
                <small>Eksplorasi data pendaftar beasiswa</small>
            </Card.Header>
            <Card.Body>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Control
                            size="sm"
                            placeholder="Cari nama atau NIM..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Col>
                    <Col md={6}>
                        <Form.Select 
                            size="sm" 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Semua Status</option>
                            <option value="Terima">Diterima</option>
                            <option value="Tidak">Ditolak</option>
                        </Form.Select>
                    </Col>
                </Row>

                <div className="mb-3 text-center">
                    <Badge bg="primary" className="me-2">
                        Total: {filteredData.length}
                    </Badge>
                    <Badge bg="success" className="me-2">
                        Diterima: {filteredData.filter(item => (item.statusKelulusan || '').trim() === 'Terima').length}
                    </Badge>
                    <Badge bg="danger">
                        Ditolak: {filteredData.filter(item => (item.statusKelulusan || '').trim() === 'Tidak').length}
                    </Badge>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table striped hover size="sm">
                        <thead className="sticky-top bg-light">
                            <tr>
                                <th>Nama</th>
                                <th>IPK</th>
                                <th>Penghasilan</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.slice(0, 50).map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="fw-semibold">{item.nama}</div>
                                        <small className="text-muted">{item.nim}</small>
                                    </td>
                                    <td>
                                        <Badge bg={parseFloat(item.ipk) >= 3.5 ? 'success' : 'warning'}>
                                            {item.ipk}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg="info">
                                            {item.penghasilanOrtu}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg={(item.statusKelulusan || '').trim() === 'Terima' ? 'success' : 'danger'}>
                                            {(item.statusKelulusan || '').trim()}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {filteredData.length > 50 && (
                    <div className="mt-2 text-center">
                        <small className="text-muted">
                            Menampilkan 50 dari {filteredData.length} hasil
                        </small>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default SimpleDataExplorer;