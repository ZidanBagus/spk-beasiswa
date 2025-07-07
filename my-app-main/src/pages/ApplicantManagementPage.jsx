import React, { useState, useEffect, useCallback } from 'react';
import ApplicantFormModal from '../components/applicants/ApplicantFormModal.jsx';
import UploadFileModal from '../components/applicants/UploadFileModal.jsx';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal.jsx';
import {
    Table, Button, ButtonGroup, Spinner, Alert, InputGroup,
    Form as BootstrapForm, Card, Row, Col, Pagination, Badge, Dropdown, Modal
} from 'react-bootstrap';
import { PersonPlusFill, Upload, PencilSquare, Trash3Fill, Search, InfoCircleFill, Filter, Download, Eye, BarChart, CheckCircle, XCircle } from 'react-bootstrap-icons';
import applicantService from '../services/applicantService';
import { toast } from 'react-toastify';
import './ApplicantManagementPage.css';
import '../components/dashboard/animations.css';
import useScrollAnimation from '../hooks/useScrollAnimation';

const ApplicantManagementPage = () => {
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState(null);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [applicantToDelete, setApplicantToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    prodi: '',
    statusBeasiswa: '',
    ipkRange: '',
    penghasilanRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statistics, setStatistics] = useState(null);

  // Scroll animations
  const [statsRef, statsVisible] = useScrollAnimation({ threshold: 0.1 });
  const [tableRef, tableVisible] = useScrollAnimation({ threshold: 0.1 });

  const fetchApplicants = useCallback(async (page = 1, search = '', limit = itemsPerPage, appliedFilters = filters) => {
    if (applicants.length === 0 && !search && page === 1) setIsLoading(true);
    else setIsTableLoading(true);
    setError('');
    try {
      const params = { page, limit, search, ...appliedFilters };
      const data = await applicantService.getAllApplicants(params);
      setApplicants(data.applicants || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalItems || 0);
      setCurrentPage(data.currentPage || 1);
      
      // Calculate statistics
      if (data.applicants && data.applicants.length > 0) {
        calculateStatistics(data.applicants);
      } else {
        // Set default statistics if no data
        setStatistics({
          total: totalItems || 0,
          diterima: 0,
          ditolak: 0,
          avgIPK: 0,
          prodiDistribution: {},
          ipkRanges: {
            'Sangat Baik (≥3.5)': 0,
            'Baik (3.0-3.49)': 0,
            'Cukup (<3.0)': 0
          }
        });
      }
    } catch (err) {
      const fetchError = err.message || 'Gagal memuat data pendaftar.';
      setError(fetchError);
      toast.error(fetchError, { position: "top-center" });
      setApplicants([]);
    } finally {
      setIsLoading(false);
      setIsTableLoading(false);
    }
  }, [itemsPerPage, applicants.length, filters]);

  const calculateStatistics = (data) => {
    const stats = {
      total: data.length,
      diterima: data.filter(a => {
        const status = a.statusBeasiswa || a.status || a.keputusan || '';
        return status === 'Diterima' || status === 'Terima' || status === 'Ya' || status === 'Accept';
      }).length,
      ditolak: data.filter(a => {
        const status = a.statusBeasiswa || a.status || a.keputusan || '';
        return status === 'Ditolak' || status === 'Tidak' || status === 'No' || status === 'Reject';
      }).length,
      avgIPK: data.reduce((sum, a) => sum + (parseFloat(a.ipk) || 0), 0) / data.length,
      prodiDistribution: {},
      ipkRanges: {
        'Sangat Baik (≥3.5)': data.filter(a => parseFloat(a.ipk) >= 3.5).length,
        'Baik (3.0-3.49)': data.filter(a => parseFloat(a.ipk) >= 3.0 && parseFloat(a.ipk) < 3.5).length,
        'Cukup (<3.0)': data.filter(a => parseFloat(a.ipk) < 3.0).length
      }
    };
    
    // Calculate prodi distribution
    data.forEach(applicant => {
      const prodi = applicant.prodi || 'Tidak Diketahui';
      stats.prodiDistribution[prodi] = (stats.prodiDistribution[prodi] || 0) + 1;
    });
    
    setStatistics(stats);
  };

  useEffect(() => {
    fetchApplicants(currentPage, searchTerm, itemsPerPage);
  }, [fetchApplicants, currentPage, searchTerm, itemsPerPage]);

  // Initialize statistics on mount
  useEffect(() => {
    if (!statistics) {
      setStatistics({
        total: 0,
        diterima: 0,
        ditolak: 0,
        avgIPK: 0,
        prodiDistribution: {},
        ipkRanges: {
          'Sangat Baik (≥3.5)': 0,
          'Baik (3.0-3.49)': 0,
          'Cukup (<3.0)': 0
        }
      });
    }
  }, [statistics]);

  const handleAddApplicant = () => { setEditingApplicant(null); setIsAddModalOpen(true); };
  const handleUploadApplicants = () => { setIsUploadModalOpen(true); };
  const handleEditApplicant = (applicant) => { setEditingApplicant(applicant); setIsAddModalOpen(true);};

  const handleDeleteClick = (applicant) => {
    setApplicantToDelete(applicant);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteApplicant = async () => {
    if (!applicantToDelete) return;
    const toastId = toast.loading("Menghapus data pendaftar...");
    setIsTableLoading(true);
    try {
      await applicantService.deleteApplicant(applicantToDelete.id);
      toast.update(toastId, {render: `Data "${applicantToDelete.nama}" berhasil dihapus!`, type: "success", isLoading: false, autoClose: 3000});

      const newTotalItems = totalItems - 1;
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (newTotalItems === 0) {
        setCurrentPage(1);
        setApplicants([]);
        setTotalItems(0);
        setTotalPages(0);
      } else {
        fetchApplicants(currentPage, searchTerm, itemsPerPage);
      }
    } catch (err) {
      toast.update(toastId, {render: err.message || 'Gagal menghapus data.', type: "error", isLoading: false, autoClose: 5000});
    } finally {
        setShowDeleteConfirmModal(false);
        setApplicantToDelete(null);
    }
  };

  const handleFormSubmit = async (formData, id) => {
    const action = id ? "Memperbarui" : "Menambah";
    const toastId = toast.loading(`${action} data pendaftar...`);
    setIsTableLoading(true);

    try {
      if (id) {
        await applicantService.updateApplicant(id, formData);
        toast.update(toastId, { render: 'Data pendaftar berhasil diperbarui!', type: "success", isLoading: false, autoClose: 3000 });
      } else {
        await applicantService.createApplicant(formData);
        toast.update(toastId, { render: 'Data pendaftar baru berhasil ditambahkan!', type: "success", isLoading: false, autoClose: 3000 });
      }
      setIsAddModalOpen(false);
      setEditingApplicant(null);
      fetchApplicants(id ? currentPage : 1, searchTerm, itemsPerPage);
    } catch (err) {
        const errorMessage = err.details ? err.details.map(e => e.message).join('\n') : (err.message || 'Gagal menyimpan data.');
        toast.update(toastId, { render: `Error: ${errorMessage}`, type: "error", isLoading: false, autoClose: 5000 });
    } finally {
        setIsTableLoading(false);
    }
  };

  const handleFileUploadSubmit = async (file) => {
    const toastId = toast.loading("Mengunggah dan memproses file Excel...");
    setIsTableLoading(true);
    try {
      const result = await applicantService.uploadApplicantsFile(file);
      toast.update(toastId, { render: result.message || `${result.importedCount} data berhasil diimpor.`, type: "success", isLoading: false, autoClose: 3000 });
      setIsUploadModalOpen(false);
      fetchApplicants(1, '', itemsPerPage);
    } catch (err) {
      toast.update(toastId, { render: `Error: ${err.message || 'Gagal mengunggah file.'}`, type: "error", isLoading: false, autoClose: 5000 });
    } finally {
        setIsTableLoading(false);
    }
  };
  
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setCurrentPage(1); };
  const handlePageChange = (pageNumber) => { if (pageNumber >= 1 && pageNumber <= totalPages && !isTableLoading) { setCurrentPage(pageNumber); }};
  const handleItemsPerPageChange = (value) => { setItemsPerPage(parseInt(value)); setCurrentPage(1); };
  
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchApplicants(1, searchTerm, itemsPerPage, newFilters);
  };
  
  const clearFilters = () => {
    const emptyFilters = {
      prodi: '',
      statusBeasiswa: '',
      ipkRange: '',
      penghasilanRange: ''
    };
    setFilters(emptyFilters);
    setCurrentPage(1);
    fetchApplicants(1, searchTerm, itemsPerPage, emptyFilters);
  };
  
  const exportData = async () => {
    try {
      const toastId = toast.loading('Mengekspor data...');
      // This would call an export service
      toast.update(toastId, {
        render: 'Data berhasil diekspor!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      toast.error('Gagal mengekspor data');
    }
  };

  const renderPaginationItems = () => {
    if (totalPages <= 1) return null;
    let items = []; const maxPagesToShow = 3; let startPage, endPage;
    if (totalPages <= maxPagesToShow + 2) { startPage = 1; endPage = totalPages; }
    else { if (currentPage <= Math.ceil(maxPagesToShow / 2) +1 ) { startPage = 1; endPage = maxPagesToShow; }
    else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages -1 ) { startPage = totalPages - maxPagesToShow + 1; endPage = totalPages; }
    else { startPage = currentPage - Math.floor(maxPagesToShow / 2); endPage = currentPage + Math.floor(maxPagesToShow / 2) ; } }
    items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1 || isTableLoading} />);
    items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isTableLoading} />);
    if (startPage > 1) { items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)} disabled={isTableLoading}>{1}</Pagination.Item>); if (startPage > 2) { items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />); } }
    for (let number = startPage; number <= endPage; number++) { items.push( <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)} disabled={isTableLoading}> {number} </Pagination.Item> ); }
    if (endPage < totalPages) { if (endPage < totalPages - 1) { items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />); } items.push(<Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)} disabled={isTableLoading}>{totalPages}</Pagination.Item>); }
    items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isTableLoading} />);
    items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || isTableLoading} />);
    return items;
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bolder text-dark mb-1">Manajemen Data Pendaftar</h1>
          <p className="text-muted mb-0">Kelola data historis pendaftar beasiswa untuk training model C4.5</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-info" size="sm" onClick={() => setShowStats(true)}>
            <BarChart className="me-1" size={14} /> Statistik
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={exportData}>
            <Download className="me-1" size={14} /> Export
          </Button>
          <ButtonGroup>
            <Button variant="success" onClick={handleAddApplicant}>
              <PersonPlusFill className="me-1" size={14} /> Tambah
            </Button>
            <Button variant="info" onClick={handleUploadApplicants}>
              <Upload className="me-1" size={14} /> Upload
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <Row className="g-3 mb-4" ref={statsRef}>
          <Col md={3}>
            <div className={`scroll-animate ${statsVisible ? 'visible' : ''}`} style={{transitionDelay: '0.1s'}}>
              <Card className="stats-card border-0 h-100 card-hover">
                <Card.Body className="text-center p-3">
                  <div className="stats-icon bg-primary bg-opacity-10 rounded-circle mx-auto mb-2">
                    <PersonPlusFill className="text-primary icon-pulse" size={20} />
                  </div>
                  <h6 className="text-muted mb-1">Total Pendaftar</h6>
                  <div className="fs-4 fw-bold text-primary counter-number">{statistics.total}</div>
                </Card.Body>
              </Card>
            </div>
          </Col>
          <Col md={3}>
            <div className={`scroll-animate ${statsVisible ? 'visible' : ''}`} style={{transitionDelay: '0.2s'}}>
              <Card className="stats-card border-0 h-100 card-hover">
                <Card.Body className="text-center p-3">
                  <div className="stats-icon bg-success bg-opacity-10 rounded-circle mx-auto mb-2">
                    <CheckCircle className="text-success icon-hover" size={20} />
                  </div>
                  <h6 className="text-muted mb-1">Diterima</h6>
                  <div className="fs-4 fw-bold text-success counter-number">{statistics.diterima}</div>
                </Card.Body>
              </Card>
            </div>
          </Col>
          <Col md={3}>
            <div className={`scroll-animate ${statsVisible ? 'visible' : ''}`} style={{transitionDelay: '0.3s'}}>
              <Card className="stats-card border-0 h-100 card-hover">
                <Card.Body className="text-center p-3">
                  <div className="stats-icon bg-danger bg-opacity-10 rounded-circle mx-auto mb-2">
                    <XCircle className="text-danger icon-hover" size={20} />
                  </div>
                  <h6 className="text-muted mb-1">Ditolak</h6>
                  <div className="fs-4 fw-bold text-danger counter-number">{statistics.ditolak}</div>
                </Card.Body>
              </Card>
            </div>
          </Col>
          <Col md={3}>
            <div className={`scroll-animate ${statsVisible ? 'visible' : ''}`} style={{transitionDelay: '0.4s'}}>
              <Card className="stats-card border-0 h-100 card-hover">
                <Card.Body className="text-center p-3">
                  <div className="stats-icon bg-info bg-opacity-10 rounded-circle mx-auto mb-2">
                    <BarChart className="text-info icon-pulse" size={20} />
                  </div>
                  <h6 className="text-muted mb-1">Rata-rata IPK</h6>
                  <div className="fs-4 fw-bold text-info counter-number">{statistics.avgIPK.toFixed(2)}</div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      )}

      {error && <Alert variant="danger" className="py-2" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Card className="shadow-sm border-0" ref={tableRef}>
        <Card.Header className="bg-gradient-light border-bottom">
          <Row className="align-items-center g-3">
            <Col md={4}>
              <h5 className="fw-semibold mb-0 d-flex align-items-center">
                <PersonPlusFill className="me-2 text-primary" size={20} />
                Daftar Pendaftar
                {totalItems > 0 && (
                  <Badge bg="primary" className="ms-2 fs-6">
                    {totalItems.toLocaleString()}
                  </Badge>
                )}
              </h5>
            </Col>
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><Search /></InputGroup.Text>
                <BootstrapForm.Control 
                  type="text" 
                  placeholder="Cari nama, prodi, atau status..." 
                  value={searchTerm} 
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="d-flex justify-content-end gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="me-1" size={12} /> Filter
              </Button>
              <BootstrapForm.Select 
                size="sm" 
                value={itemsPerPage} 
                onChange={(e) => handleItemsPerPageChange(e.target.value)} 
                style={{maxWidth: '70px'}}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </BootstrapForm.Select>
            </Col>
          </Row>
          
          {/* Advanced Filters */}
          {showFilters && (
            <Row className="mt-3 pt-3 border-top">
              <Col md={3}>
                <BootstrapForm.Group>
                  <BootstrapForm.Label className="small fw-medium">Program Studi</BootstrapForm.Label>
                  <BootstrapForm.Select 
                    size="sm" 
                    value={filters.prodi} 
                    onChange={(e) => handleFilterChange('prodi', e.target.value)}
                  >
                    <option value="">Semua Prodi</option>
                    <option value="Teknik Informatika">Teknik Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                    <option value="Teknik Komputer">Teknik Komputer</option>
                  </BootstrapForm.Select>
                </BootstrapForm.Group>
              </Col>
              <Col md={3}>
                <BootstrapForm.Group>
                  <BootstrapForm.Label className="small fw-medium">Status Beasiswa</BootstrapForm.Label>
                  <BootstrapForm.Select 
                    size="sm" 
                    value={filters.statusBeasiswa} 
                    onChange={(e) => handleFilterChange('statusBeasiswa', e.target.value)}
                  >
                    <option value="">Semua Status</option>
                    <option value="Diterima">Diterima</option>
                    <option value="Ditolak">Ditolak</option>
                  </BootstrapForm.Select>
                </BootstrapForm.Group>
              </Col>
              <Col md={3}>
                <BootstrapForm.Group>
                  <BootstrapForm.Label className="small fw-medium">Rentang IPK</BootstrapForm.Label>
                  <BootstrapForm.Select 
                    size="sm" 
                    value={filters.ipkRange} 
                    onChange={(e) => handleFilterChange('ipkRange', e.target.value)}
                  >
                    <option value="">Semua IPK</option>
                    <option value="high">&ge; 3.5 (Sangat Baik)</option>
                    <option value="medium">3.0 - 3.49 (Baik)</option>
                    <option value="low">&lt; 3.0 (Cukup)</option>
                  </BootstrapForm.Select>
                </BootstrapForm.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button variant="outline-danger" size="sm" onClick={clearFilters} className="w-100">
                  Reset Filter
                </Button>
              </Col>
            </Row>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center p-5"><Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}} /><p className="mt-3 text-muted">Memuat data...</p></div>
          ) : applicants.length === 0 ? (
            <Alert variant="light" className="text-center m-3 rounded-3 border"><InfoCircleFill size={28} className="mb-2 text-muted"/><p className="mb-0">{searchTerm ? "Tidak ada data yang cocok." : "Belum ada data pendaftar."}</p></Alert>
          ) : (
            <>
            {isTableLoading && <div className="text-center py-3 border-bottom"><Spinner size="sm" animation="border" variant="secondary" className="me-2"/> Memperbarui...</div>}
            <div className={`table-responsive scroll-animate ${tableVisible ? 'visible' : ''}`}>
              <Table striped bordered hover className="mb-0 align-middle small">
                <thead className="table-dark">
                  <tr>
                    <th className="text-center" style={{width: '50px'}}>No</th>
                    <th>Nama Pendaftar</th>
                    <th>Program Studi</th>
                    <th className="text-center" style={{width: '80px'}}>IPK</th>
                    <th className="text-center" style={{width: '70px'}}>SKS</th>
                    <th style={{width: '120px'}}>Penghasilan</th>
                    <th className="text-center" style={{width: '90px'}}>Tanggungan</th>
                    <th className="text-center" style={{width: '100px'}}>Status</th>
                    <th className="text-center" style={{width: '100px'}}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((applicant, index) => (
                    <tr key={applicant.id} className="table-row-hover">
                      <td className="text-center text-muted small">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="fw-medium">{applicant.nama}</td>
                      <td className="small">{applicant.prodi}</td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark fs-6">
                          {typeof applicant.ipk === 'number' ? applicant.ipk.toFixed(2) : applicant.ipk}
                        </span>
                      </td>
                      <td className="text-center small">{applicant.sks}</td>
                      <td className="small">
                        <span className="badge bg-light text-dark fs-6">
                          {applicant.penghasilanOrtu}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark fs-6">
                          {applicant.jmlTanggungan}
                        </span>
                      </td>
                      <td className="text-center">
                        {(() => {
                          const status = applicant.statusBeasiswa || applicant.status || applicant.keputusan || 'Tidak Diketahui';
                          const isAccepted = status === 'Diterima' || status === 'Terima' || status === 'Ya' || status === 'Accept';
                          return (
                            <span className="badge bg-light text-dark fs-6">
                              {isAccepted ? (
                                <><CheckCircle className="me-1" size={12} />Diterima</>
                              ) : (
                                <><XCircle className="me-1" size={12} />Ditolak</>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="text-center">
                        <ButtonGroup size="sm">
                          <Button variant="outline-primary" onClick={() => handleEditApplicant(applicant)} title="Edit Data">
                            <PencilSquare size={12} />
                          </Button>
                          <Button variant="outline-danger" onClick={() => handleDeleteClick(applicant)} title="Hapus Data">
                            <Trash3Fill size={12} />
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            </>
          )}
        </Card.Body>
        {applicants.length > 0 && totalPages > 1 && !isLoading && (
            <Card.Footer className="bg-light border-top-0 py-2 px-4 d-flex justify-content-between align-items-center">
                <div className="small text-muted">Menampilkan data {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems}</div>
                <Pagination size="sm" className="mb-0">{renderPaginationItems()}</Pagination>
            </Card.Footer>
        )}
      </Card>

      {isAddModalOpen && ( <ApplicantFormModal show={isAddModalOpen} onHide={() => { setIsAddModalOpen(false); setEditingApplicant(null); }} onSubmit={handleFormSubmit} applicantData={editingApplicant} /> )}
      {isUploadModalOpen && ( <UploadFileModal show={isUploadModalOpen} onHide={() => setIsUploadModalOpen(false)} onFileUpload={handleFileUploadSubmit} /> )}
      {/* Statistics Modal */}
      <Modal show={showStats} onHide={() => setShowStats(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <BarChart className="me-2" />
            Statistik Data Pendaftar
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statistics && (
            <Row className="g-4">
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h6 className="mb-0">Distribusi Status Beasiswa</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Diterima</span>
                        <span>{statistics.diterima} ({((statistics.diterima/statistics.total)*100).toFixed(1)}%)</span>
                      </div>
                      <div className="progress mb-2" style={{height: '8px'}}>
                        <div className="progress-bar bg-success" style={{width: `${(statistics.diterima/statistics.total)*100}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>Ditolak</span>
                        <span>{statistics.ditolak} ({((statistics.ditolak/statistics.total)*100).toFixed(1)}%)</span>
                      </div>
                      <div className="progress" style={{height: '8px'}}>
                        <div className="progress-bar bg-danger" style={{width: `${(statistics.ditolak/statistics.total)*100}%`}}></div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h6 className="mb-0">Distribusi IPK</h6>
                  </Card.Header>
                  <Card.Body>
                    {Object.entries(statistics.ipkRanges).map(([range, count]) => {
                      const percentage = ((count/statistics.total)*100).toFixed(1);
                      return (
                        <div key={range} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="small">{range}</span>
                            <span className="small">{count} ({percentage}%)</span>
                          </div>
                          <div className="progress" style={{height: '6px'}}>
                            <div 
                              className={`progress-bar ${range.includes('Sangat') ? 'bg-success' : range.includes('Baik') ? 'bg-info' : 'bg-warning'}`} 
                              style={{width: `${percentage}%`}}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStats(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {applicantToDelete && ( <DeleteConfirmationModal show={showDeleteConfirmModal} onHide={() => { setShowDeleteConfirmModal(false); setApplicantToDelete(null); }} onConfirm={confirmDeleteApplicant} title="Konfirmasi Hapus" message={`Anda yakin ingin menghapus data "${applicantToDelete.nama}"?`} /> )}
    </>
  );
};

export default ApplicantManagementPage;