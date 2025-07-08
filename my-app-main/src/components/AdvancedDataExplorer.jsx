import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Table, Badge, Button, InputGroup } from 'react-bootstrap';
import { Search, Filter, Download, Eye } from 'react-bootstrap-icons';
import reportService from '../services/reportService';

const AdvancedDataExplorer = ({ isLoading }) => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        status: 'all',
        ipkRange: 'all',
        penghasilan: 'all',
        organisasi: 'all',
        search: ''
    });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [data, filters, sortConfig]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await reportService.getAllSelectionResults({ limit: 99999 });
            const results = response.results || [];
            setData(results);
            calculateStats(results);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const accepted = data.filter(item => (item.statusKelulusan || '').trim() === 'Terima').length;
        const avgIPK = data.reduce((sum, item) => sum + parseFloat(item.ipk || 0), 0) / total || 0;
        const lowIncome = data.filter(item => item.penghasilanOrtu === 'Rendah').length;
        const activeOrg = data.filter(item => item.ikutOrganisasi === 'Ya').length;

        setStats({
            total,
            accepted,
            rejected: total - accepted,
            acceptanceRate: total > 0 ? (accepted / total * 100) : 0,
            avgIPK,
            lowIncomePercent: total > 0 ? (lowIncome / total * 100) : 0,
            activeOrgPercent: total > 0 ? (activeOrg / total * 100) : 0
        });
    };

    const applyFilters = () => {
        let filtered = [...data];

        // Filter by status
        if (filters.status !== 'all') {
            filtered = filtered.filter(item => 
                (item.statusKelulusan || '').trim() === filters.status
            );
        }

        // Filter by IPK range
        if (filters.ipkRange !== 'all') {
            filtered = filtered.filter(item => {
                const ipk = parseFloat(item.ipk || 0);
                switch (filters.ipkRange) {
                    case 'high': return ipk >= 3.5;
                    case 'medium': return ipk >= 3.0 && ipk < 3.5;
                    case 'low': return ipk < 3.0;
                    default: return true;
                }
            });
        }

        // Filter by penghasilan
        if (filters.penghasilan !== 'all') {
            filtered = filtered.filter(item => item.penghasilanOrtu === filters.penghasilan);
        }

        // Filter by organisasi
        if (filters.organisasi !== 'all') {
            filtered = filtered.filter(item => item.ikutOrganisasi === filters.organisasi);
        }

        // Search filter
        if (filters.search) {
            filtered = filtered.filter(item =>
                (item.nama || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (item.nim || '').toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key] || '';
                let bValue = b[sortConfig.key] || '';
                
                if (sortConfig.key === 'ipk') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                }
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const exportData = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Nama,NIM,IPK,Penghasilan,Tanggungan,Organisasi,UKM,Status\n"
            + filteredData.map(item => 
                `${item.nama},${item.nim},${item.ipk},${item.penghasilanOrtu},${item.jmlTanggungan},${item.ikutOrganisasi},${item.ikutUKM},${item.statusKelulusan}`
            ).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `data_explorer_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            ipkRange: 'all',
            penghasilan: 'all',
            organisasi: 'all',
            search: ''
        });
        setSortConfig({ key: null, direction: 'asc' });
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if (isLoading || loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <Search className="me-2" />
                        Advanced Data Explorer
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
            <Card.Header className="bg-gradient-warning text-dark">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-0">
                            <Search className="me-2" />
                            Advanced Data Explorer
                        </h6>
                        <small>Eksplorasi dan analisis data pendaftar secara mendalam</small>
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="outline-dark" size="sm" onClick={exportData}>
                            <Download className="me-1" />
                            Export ({filteredData.length})
                        </Button>
                        <Button variant="outline-dark" size="sm" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {/* Quick Stats */}
                {stats && (
                    <Row className="mb-3 text-center">
                        <Col xs="3">
                            <div className="text-primary fw-bold">{filteredData.length}</div>
                            <small className="text-muted">Filtered Results</small>
                        </Col>
                        <Col xs="3">
                            <div className="text-success fw-bold">{stats.acceptanceRate.toFixed(1)}%</div>
                            <small className="text-muted">Acceptance Rate</small>
                        </Col>
                        <Col xs="3">
                            <div className="text-warning fw-bold">{stats.avgIPK.toFixed(2)}</div>
                            <small className="text-muted">Avg IPK</small>
                        </Col>
                        <Col xs="3">
                            <div className="text-info fw-bold">{stats.lowIncomePercent.toFixed(1)}%</div>
                            <small className="text-muted">Low Income</small>
                        </Col>
                    </Row>
                )}

                {/* Filters */}
                <Row className="mb-3">
                    <Col md="2">
                        <Form.Select size="sm" value={filters.status} 
                                   onChange={(e) => handleFilterChange('status', e.target.value)}>
                            <option value="all">Semua Status</option>
                            <option value="Terima">Diterima</option>
                            <option value="Tidak">Ditolak</option>
                        </Form.Select>
                    </Col>
                    <Col md="2">
                        <Form.Select size="sm" value={filters.ipkRange} 
                                   onChange={(e) => handleFilterChange('ipkRange', e.target.value)}>
                            <option value="all">Semua IPK</option>
                            <option value="high">IPK Tinggi (3.5+)</option>
                            <option value="medium">IPK Sedang (3.0-3.5)</option>
                            <option value="low">IPK Rendah (kurang dari 3.0)</option>
                        </Form.Select>
                    </Col>
                    <Col md="2">
                        <Form.Select size="sm" value={filters.penghasilan} 
                                   onChange={(e) => handleFilterChange('penghasilan', e.target.value)}>
                            <option value="all">Semua Penghasilan</option>
                            <option value="Rendah">Rendah</option>
                            <option value="Sedang">Sedang</option>
                            <option value="Tinggi">Tinggi</option>
                        </Form.Select>
                    </Col>
                    <Col md="2">
                        <Form.Select size="sm" value={filters.organisasi} 
                                   onChange={(e) => handleFilterChange('organisasi', e.target.value)}>
                            <option value="all">Semua Organisasi</option>
                            <option value="Ya">Aktif</option>
                            <option value="Tidak">Tidak Aktif</option>
                        </Form.Select>
                    </Col>
                    <Col md="4">
                        <InputGroup size="sm">
                            <InputGroup.Text><Search /></InputGroup.Text>
                            <Form.Control
                                placeholder="Cari nama atau NIM..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                </Row>

                {/* Data Table */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table striped hover size="sm">
                        <thead className="sticky-top bg-light">
                            <tr>
                                <th style={{cursor: 'pointer'}} onClick={() => handleSort('nama')}>
                                    Nama {sortConfig.key === 'nama' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{cursor: 'pointer'}} onClick={() => handleSort('ipk')}>
                                    IPK {sortConfig.key === 'ipk' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Penghasilan</th>
                                <th>Organisasi</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="fw-semibold">{item.nama}</div>
                                        <small className="text-muted">{item.nim}</small>
                                    </td>
                                    <td>
                                        <Badge bg={parseFloat(item.ipk) >= 3.5 ? 'success' : parseFloat(item.ipk) >= 3.0 ? 'warning' : 'danger'}>
                                            {item.ipk}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg={item.penghasilanOrtu === 'Rendah' ? 'info' : 'secondary'}>
                                            {item.penghasilanOrtu}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg={item.ikutOrganisasi === 'Ya' ? 'primary' : 'light'} text={item.ikutOrganisasi === 'Ya' ? 'white' : 'dark'}>
                                            {item.ikutOrganisasi}
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <small className="text-muted">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
                        </small>
                        <div className="d-flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? 'warning' : 'outline-warning'}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default AdvancedDataExplorer;