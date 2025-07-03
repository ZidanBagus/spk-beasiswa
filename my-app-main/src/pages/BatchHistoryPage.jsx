// src/pages/BatchHistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Button, Spinner, Alert, Card, Row, Col, Badge, InputGroup, 
  FormControl, Container, Form, ButtonGroup, Pagination, Modal, ProgressBar, Tabs, Tab
} from 'react-bootstrap';
import { 
  ClockHistory, EyeFill, CheckCircleFill, XCircleFill, HourglassSplit, 
  Search, SortAlphaDown, SortAlphaUp, SortNumericDown, SortNumericUp,
  Calendar, BarChart, Trash, ArrowClockwise, ArrowUpShort, Award, InfoCircle, Download, Share
} from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import batchService from '../services/batchService';
import { toast } from 'react-toastify';
import './BatchHistoryPage.css';

const BatchHistoryPage = () => {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [analytics, setAnalytics] = useState({
    monthlyTrends: [],
    accuracyDistribution: {},
    performanceMetrics: {}
  });

  const fetchBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await batchService.getAll();
      setBatches(data);
      setFilteredBatches(data);
      calculateAnalytics(data);
    } catch (error) {
      toast.error(error.message || 'Gagal memuat riwayat pengujian.');
      setBatches([]);
      setFilteredBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateAnalytics = (data) => {
    // Monthly trends
    const monthlyData = {};
    data.forEach(batch => {
      const month = new Date(batch.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, tested: 0, avgAccuracy: 0 };
      }
      monthlyData[month].total++;
      const accuracy = batch.accuracy || batch.akurasi || batch.modelAccuracy;
      if (accuracy && accuracy > 0) {
        monthlyData[month].tested++;
        monthlyData[month].avgAccuracy += parseFloat(accuracy);
      }
    });

    // Calculate average accuracy for each month
    Object.keys(monthlyData).forEach(month => {
      if (monthlyData[month].tested > 0) {
        monthlyData[month].avgAccuracy = monthlyData[month].avgAccuracy / monthlyData[month].tested;
      }
    });

    // Accuracy distribution
    const accuracyRanges = { 'Excellent (≥90%)': 0, 'Good (80-89%)': 0, 'Fair (70-79%)': 0, 'Poor (<70%)': 0 };
    data.forEach(batch => {
      const accuracy = batch.accuracy || batch.akurasi || batch.modelAccuracy;
      if (accuracy && accuracy > 0) {
        const acc = parseFloat(accuracy);
        if (acc >= 90) accuracyRanges['Excellent (≥90%)']++;
        else if (acc >= 80) accuracyRanges['Good (80-89%)']++;
        else if (acc >= 70) accuracyRanges['Fair (70-79%)']++;
        else accuracyRanges['Poor (<70%)']++;
      }
    });

    setAnalytics({
      monthlyTrends: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })),
      accuracyDistribution: accuracyRanges,
      performanceMetrics: {
        bestAccuracy: Math.max(...data.map(b => parseFloat(b.accuracy || b.akurasi || b.modelAccuracy || 0))),
        worstAccuracy: Math.min(...data.filter(b => (b.accuracy || b.akurasi || b.modelAccuracy) > 0).map(b => parseFloat(b.accuracy || b.akurasi || b.modelAccuracy))),
        totalTested: data.filter(b => (b.accuracy || b.akurasi || b.modelAccuracy) > 0).length
      }
    });
  };

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Filter and sort batches
  useEffect(() => {
    let filtered = [...batches];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(batch => 
        (batch.name || `Batch #${batch.id}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (batch.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter based on testing status
    if (statusFilter !== 'all') {
      if (statusFilter === 'tested') {
        // Filter batch yang sudah diuji (memiliki akurasi)
        filtered = filtered.filter(batch => {
          const accuracy = batch.accuracy || batch.akurasi || batch.modelAccuracy;
          return accuracy && accuracy > 0;
        });
      } else if (statusFilter === 'pending') {
        // Filter batch yang belum diuji (tidak memiliki akurasi)
        filtered = filtered.filter(batch => {
          const accuracy = batch.accuracy || batch.akurasi || batch.modelAccuracy;
          return !accuracy || accuracy === 0;
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'accuracy':
          aValue = a.accuracy || 0;
          bValue = b.accuracy || 0;
          break;
        case 'name':
          aValue = (a.name || `Batch #${a.id}`).toLowerCase();
          bValue = (b.name || `Batch #${b.id}`).toLowerCase();
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBatches(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [batches, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    const isNumeric = ['accuracy', 'totalData'].includes(field);
    if (isNumeric) {
      return sortOrder === 'ASC' ? <SortNumericUp size={14} className="ms-1 text-primary"/> : <SortNumericDown size={14} className="ms-1 text-primary"/>;
    }
    return sortOrder === 'ASC' ? <SortAlphaUp size={14} className="ms-1 text-primary"/> : <SortAlphaDown size={14} className="ms-1 text-primary"/>;
  };

  const getStatusBadge = (batch) => {
    // Determine status based on accuracy (testing status)
    const accuracy = batch.accuracy || batch.akurasi || batch.modelAccuracy;
    
    if (accuracy && accuracy > 0) {
      // Batch sudah diuji dan memiliki akurasi
      return <Badge bg="success"><CheckCircleFill className="me-1"/>Sudah Diuji</Badge>;
    } else {
      // Batch belum diuji atau tidak memiliki akurasi
      return <Badge bg="warning"><HourglassSplit className="me-1"/>Belum Diuji</Badge>;
    }
  };

  const getAccuracyBadge = (batch) => {
    // Check different possible accuracy field names
    const accuracy = batch.accuracy || batch.akurasi || batch.modelAccuracy;
    if (!accuracy || accuracy === 0) return <Badge bg="secondary">Belum Diuji</Badge>;
    
    // Handle percentage format (remove % if present)
    let acc = parseFloat(accuracy.toString().replace('%', ''));
    
    // If accuracy is greater than 1, assume it's already in percentage format
    if (acc > 1 && acc <= 100) {
      // Already in percentage
    } else if (acc <= 1) {
      // Convert from decimal to percentage
      acc = acc * 100;
    }
    
    if (acc >= 90) return <Badge bg="success">{acc.toFixed(2)}%</Badge>;
    if (acc >= 80) return <Badge bg="info">{acc.toFixed(2)}%</Badge>;
    if (acc >= 70) return <Badge bg="warning">{acc.toFixed(2)}%</Badge>;
    return <Badge bg="danger">{acc.toFixed(2)}%</Badge>;
  };

  // Pagination
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBatches = filteredBatches.slice(startIndex, endIndex);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    return items;
  };

  const renderTimelineView = () => {
    return (
      <div className="timeline-container">
        {currentBatches.map((batch, index) => {
          const accuracy = batch.accuracy || batch.akurasi || batch.modelAccuracy;
          const isTested = accuracy && accuracy > 0;
          
          return (
            <div key={batch.id} className={`timeline-item ${isTested ? 'tested' : 'pending'}`}>
              <div className="timeline-marker">
                {isTested ? <CheckCircleFill className="text-success" /> : <HourglassSplit className="text-warning" />}
              </div>
              <div className="timeline-content">
                <Card className="timeline-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-1">{batch.name || `Batch #${batch.id}`}</h6>
                      {getStatusBadge(batch)}
                    </div>
                    <div className="d-flex align-items-center mb-2 text-muted small">
                      <Calendar className="me-1" size={12} />
                      {new Date(batch.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {isTested && (
                      <div className="mb-2">
                        <small className="text-muted">Akurasi Model:</small>
                        <div>{getAccuracyBadge(batch)}</div>
                      </div>
                    )}
                    <p className="small text-muted mb-2">{batch.description || 'Tidak ada deskripsi'}</p>
                    <Button 
                      as={Link} 
                      to={`/reports?batchId=${batch.id}`} 
                      variant="outline-primary" 
                      size="sm"
                    >
                      <EyeFill className="me-1" size={12} /> Lihat Detail
                    </Button>
                  </Card.Body>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bolder text-dark mb-1">Riwayat Pengujian Model</h1>
          <p className="text-muted mb-0">Kelola dan pantau riwayat pengujian model C4.5</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-info" onClick={() => setShowAnalytics(true)} disabled={isLoading}>
            <ArrowUpShort className="me-2" size={16}/>
            Analytics
          </Button>
          <ButtonGroup>
            <Button 
              variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('table')}
              size="sm"
            >
              <BarChart className="me-1" size={14} /> Tabel
            </Button>
            <Button 
              variant={viewMode === 'timeline' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('timeline')}
              size="sm"
            >
              <ClockHistory className="me-1" size={14} /> Timeline
            </Button>
          </ButtonGroup>
          <Button variant="outline-primary" onClick={fetchBatches} disabled={isLoading}>
            <ArrowClockwise className="me-2" size={16}/>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Header className="bg-light">
          <h5 className="mb-0 d-flex align-items-center">
            <Search className="me-2 text-primary"/>Filter & Pencarian
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-medium">Cari Batch</Form.Label>
                <InputGroup>
                  <InputGroup.Text><Search /></InputGroup.Text>
                  <FormControl
                    placeholder="Cari nama batch atau deskripsi..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium">Status Pengujian</Form.Label>
                <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">Semua Batch</option>
                  <option value="tested">Sudah Diuji</option>
                  <option value="pending">Belum Diuji</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium">Urutkan</Form.Label>
                <Form.Select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="createdAt">Tanggal Dibuat</option>
                  <option value="accuracy">Akurasi</option>
                  <option value="name">Nama Batch</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Enhanced Summary Cards */}
      <Row className="g-4 mb-4">
        <Col lg={3} md={6}>
          <Card className="stats-card border-0 h-100">
            <Card.Body className="text-center p-4">
              <div className="stats-icon bg-primary bg-opacity-10 rounded-circle mx-auto mb-3">
                <BarChart className="text-primary" size={24} />
              </div>
              <h6 className="text-muted mb-1">Total Batch</h6>
              <div className="fs-2 fw-bold text-primary mb-2">{batches.length}</div>
              <small className="text-muted">Sesi pengujian</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="stats-card border-0 h-100">
            <Card.Body className="text-center p-4">
              <div className="stats-icon bg-success bg-opacity-10 rounded-circle mx-auto mb-3">
                <CheckCircleFill className="text-success" size={24} />
              </div>
              <h6 className="text-muted mb-1">Sudah Diuji</h6>
              <div className="fs-2 fw-bold text-success mb-2">
                {batches.filter(b => {
                  const accuracy = b.accuracy || b.akurasi || b.modelAccuracy;
                  return accuracy && accuracy > 0;
                }).length}
              </div>
              <ProgressBar 
                variant="success" 
                now={(batches.filter(b => (b.accuracy || b.akurasi || b.modelAccuracy) > 0).length / batches.length) * 100} 
                style={{ height: '4px' }}
                className="rounded-pill"
              />
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="stats-card border-0 h-100">
            <Card.Body className="text-center p-4">
              <div className="stats-icon bg-warning bg-opacity-10 rounded-circle mx-auto mb-3">
                <HourglassSplit className="text-warning" size={24} />
              </div>
              <h6 className="text-muted mb-1">Belum Diuji</h6>
              <div className="fs-2 fw-bold text-warning mb-2">
                {batches.filter(b => {
                  const accuracy = b.accuracy || b.akurasi || b.modelAccuracy;
                  return !accuracy || accuracy === 0;
                }).length}
              </div>
              <small className="text-muted">Menunggu pengujian</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="stats-card border-0 h-100">
            <Card.Body className="text-center p-4">
              <div className="stats-icon bg-info bg-opacity-10 rounded-circle mx-auto mb-3">
                <Award className="text-info" size={24} />
              </div>
              <h6 className="text-muted mb-1">Rata-rata Akurasi</h6>
              <div className="fs-2 fw-bold text-info mb-2">
                {(() => {
                  const testedBatches = batches.filter(b => {
                    const accuracy = b.accuracy || b.akurasi || b.modelAccuracy;
                    return accuracy && accuracy > 0;
                  });
                  if (testedBatches.length === 0) return '0%';
                  const avgAccuracy = testedBatches.reduce((sum, b) => {
                    const accuracy = b.accuracy || b.akurasi || b.modelAccuracy;
                    return sum + parseFloat(accuracy);
                  }, 0) / testedBatches.length;
                  return `${avgAccuracy.toFixed(1)}%`;
                })()}
              </div>
              <small className="text-muted">Performa model</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Batch List */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-flex align-items-center">
              {viewMode === 'table' ? <BarChart className="me-2 text-primary"/> : <ClockHistory className="me-2 text-primary"/>}
              {viewMode === 'table' ? 'Daftar Sesi Pengujian' : 'Timeline Pengujian'}
            </h5>
            <div className="d-flex align-items-center gap-3">
              <small className="text-muted">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredBatches.length)} dari {filteredBatches.length} batch
              </small>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <div className="mt-2 text-muted">Memuat riwayat...</div>
            </div>
          ) : filteredBatches.length === 0 ? (
            <Alert variant="light" className="text-center m-3">
              <ClockHistory size={28} className="mb-2 text-muted"/>
              <p className="mb-0">
                {searchTerm || statusFilter !== 'all' ? 'Tidak ada batch yang sesuai dengan filter.' : 'Belum ada riwayat pengujian.'}
              </p>
            </Alert>
          ) : (
            <>
              {viewMode === 'table' ? (
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th className="text-center" style={{width: '60px'}}>No</th>
                        <th 
                          onClick={() => handleSort('name')} 
                          className="sortable-header"
                        >
                          Nama Batch <SortIcon field="name"/>
                        </th>
                        <th 
                          onClick={() => handleSort('createdAt')} 
                          className="sortable-header"
                        >
                          Tanggal <SortIcon field="createdAt"/>
                        </th>
                        <th 
                          onClick={() => handleSort('accuracy')} 
                          className="sortable-header text-center"
                        >
                          Akurasi <SortIcon field="accuracy"/>
                        </th>
                        <th className="text-center">Status</th>
                        <th>Deskripsi</th>
                        <th className="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBatches.map((batch, index) => (
                        <tr key={batch.id} className="table-row-hover">
                          <td className="text-center text-muted">{startIndex + index + 1}</td>
                          <td className="fw-medium">
                            {batch.name || `Batch #${batch.id}`}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Calendar className="me-2 text-muted" size={14}/>
                              <div>
                                <div className="small fw-medium">
                                  {new Date(batch.createdAt).toLocaleDateString('id-ID')}
                                </div>
                                <div className="small text-muted">
                                  {new Date(batch.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            {getAccuracyBadge(batch)}
                          </td>
                          <td className="text-center">
                            {getStatusBadge(batch)}
                          </td>
                          <td className="small text-muted">
                            {batch.description || 'Tidak ada deskripsi'}
                          </td>
                          <td className="text-center">
                            <ButtonGroup size="sm">
                              <Button 
                                as={Link} 
                                to={`/reports?batchId=${batch.id}`} 
                                variant="outline-primary" 
                                title="Lihat Detail Laporan"
                              >
                                <EyeFill className="me-1" size={12}/> Detail
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                renderTimelineView()
              )}
              
              {totalPages > 1 && (
                <Card.Footer className="bg-light border-top-0 py-2 px-4 d-flex justify-content-center">
                  <Pagination size="sm" className="mb-0">
                    <Pagination.Prev 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                      disabled={currentPage === 1} 
                    />
                    {renderPaginationItems()}
                    <Pagination.Next 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                      disabled={currentPage === totalPages} 
                    />
                  </Pagination>
                </Card.Footer>
              )}
            </>
          )}
        </Card.Body>
      </Card>
      {/* Analytics Modal */}
      <Modal show={showAnalytics} onHide={() => setShowAnalytics(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <ArrowUpShort className="me-2" />
            Analytics Pengujian Model
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="overview" className="mb-4">
            <Tab eventKey="overview" title="Overview">
              <Row className="g-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Distribusi Akurasi</h6>
                    </Card.Header>
                    <Card.Body>
                      {Object.entries(analytics.accuracyDistribution).map(([range, count]) => {
                        const total = Object.values(analytics.accuracyDistribution).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                        return (
                          <div key={range} className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small">{range}</span>
                              <span className="small">{count} ({percentage}%)</span>
                            </div>
                            <ProgressBar 
                              variant={range.includes('Excellent') ? 'success' : range.includes('Good') ? 'info' : range.includes('Fair') ? 'warning' : 'danger'} 
                              now={percentage} 
                              style={{height: '8px'}} 
                            />
                          </div>
                        );
                      })}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Metrik Performa</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                            <Award className="text-success mb-2" size={20} />
                            <div className="fw-bold text-success">{analytics.performanceMetrics.bestAccuracy?.toFixed(1) || 0}%</div>
                            <small className="text-muted">Akurasi Terbaik</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                            <BarChart className="text-info mb-2" size={20} />
                            <div className="fw-bold text-info">{analytics.performanceMetrics.totalTested || 0}</div>
                            <small className="text-muted">Total Diuji</small>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="trends" title="Trends">
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Tren Bulanan</h6>
                </Card.Header>
                <Card.Body>
                  {analytics.monthlyTrends.length > 0 ? (
                    <div className="table-responsive">
                      <Table size="sm">
                        <thead>
                          <tr>
                            <th>Bulan</th>
                            <th>Total Batch</th>
                            <th>Sudah Diuji</th>
                            <th>Rata-rata Akurasi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.monthlyTrends.map(trend => (
                            <tr key={trend.month}>
                              <td>{trend.month}</td>
                              <td>{trend.total}</td>
                              <td className="text-success">{trend.tested}</td>
                              <td>
                                <Badge bg="info">
                                  {trend.tested > 0 ? `${trend.avgAccuracy.toFixed(1)}%` : 'N/A'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted text-center">Tidak ada data trend tersedia</p>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAnalytics(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BatchHistoryPage;
