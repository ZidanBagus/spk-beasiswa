import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Table, Button, ButtonGroup, Form as BootstrapForm, Card,
    Row, Col, Alert, Spinner, Pagination, InputGroup, Container, Badge, ProgressBar, Modal, Tabs, Tab
} from 'react-bootstrap';
import {
    FilterSquare, BarChartLineFill, CheckCircleFill, XCircleFill, InfoCircleFill,
    FiletypePdf, FileEarmarkSpreadsheetFill, SortAlphaDown, SortAlphaUp, SortNumericDown, SortNumericUp, Search,
    PieChart, ArrowUpShort, Calendar, People, Award, Eye, Download, Printer, Share
} from 'react-bootstrap-icons';
import reportService from '../services/reportService';
import batchService from '../services/batchService';
import { toast } from 'react-toastify';
import './ReportPage.css';

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getQueryParam = useCallback((paramName) => new URLSearchParams(location.search).get(paramName), [location.search]);

  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    status: getQueryParam('status') || 'semua',
    searchTerm: getQueryParam('search') || '',
    sortBy: getQueryParam('sortBy') || 'tanggalSeleksi',
    sortOrder: getQueryParam('sortOrder') || 'DESC',
    dateFrom: getQueryParam('dateFrom') || '',
    dateTo: getQueryParam('dateTo') || '',
    batchId: getQueryParam('batchId') || ''
  });

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [summary, setSummary] = useState({ total: 0, Terima: 0, Tidak: 0 });
  const [analytics, setAnalytics] = useState({
    monthlyTrends: [],
    attributeDistribution: {},
    acceptanceByIPK: {},
    acceptanceByIncome: {}
  });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState('data');

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await batchService.getAll();
        console.log('Batch data received:', data); // Debug log
        setBatches(data);
        if (filters.batchId) {
          const selected = data.find(b => b.id === parseInt(filters.batchId));
          console.log('Selected batch:', selected); // Debug log
          setSelectedBatch(selected);
        }
      } catch (err) {
        toast.error("Gagal memuat data batch: " + (err.message || "Error"));
      }
    };
    fetchBatches();
  }, [filters.batchId]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchReportData = useCallback(async (page, currentFilters) => {
    setIsLoading(true);
    setError('');
    try {
      const params = { page, limit: itemsPerPage, ...currentFilters, fetchAll: 'false' };
      const data = await reportService.getAllSelectionResults(params);
      
      setReportData(data.results || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalItems || 0);
      setCurrentPage(data.currentPage || 1);
      
      if (data.summary) {
        setSummary(data.summary);
      }
      
      // Calculate analytics
      if (data.results && data.results.length > 0) {
        calculateAnalytics(data.results);
      }
    } catch (err) {
      const fetchError = err.message || 'Gagal memuat data laporan.';
      setError(fetchError);
      toast.error(fetchError);
      setReportData([]);
      setSummary({ total: 0, Terima: 0, Tidak: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const pageFromURL = parseInt(getQueryParam('page')) || 1;
    const newFilters = {
        status: getQueryParam('status') || 'semua',
        searchTerm: getQueryParam('search') || '',
        sortBy: getQueryParam('sortBy') || 'tanggalSeleksi',
        sortOrder: getQueryParam('sortOrder') || 'DESC',
        dateFrom: getQueryParam('dateFrom') || '',
        dateTo: getQueryParam('dateTo') || '',
        batchId: getQueryParam('batchId') || ''
    };
    setFilters(newFilters);
    setCurrentPage(pageFromURL);
    fetchReportData(pageFromURL, newFilters);
  }, [location.search, getQueryParam, fetchReportData]);

  const updateURL = (newFilters, newPage) => {
    const searchParams = new URLSearchParams();
    if (newPage > 1) searchParams.set('page', String(newPage));
    if (newFilters.status !== 'semua') searchParams.set('status', newFilters.status);
    if (newFilters.searchTerm) searchParams.set('search', newFilters.searchTerm);
    if (newFilters.sortBy !== 'tanggalSeleksi') searchParams.set('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder !== 'DESC') searchParams.set('sortOrder', newFilters.sortOrder);
    if (newFilters.dateFrom) searchParams.set('dateFrom', newFilters.dateFrom);
    if (newFilters.dateTo) searchParams.set('dateTo', newFilters.dateTo);
    if (newFilters.batchId) searchParams.set('batchId', newFilters.batchId);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    updateURL({ ...filters, [name]: value }, 1);
  };
  
  const handleSortChange = (newSortBy) => {
    const newOrder = filters.sortBy === newSortBy && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    updateURL({ ...filters, sortBy: newSortBy, sortOrder: newOrder }, 1);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && !isLoading) {
      updateURL(filters, pageNumber);
    }
  };

  const clearFilters = () => {
    const defaultFilters = {
      status: 'semua',
      searchTerm: '',
      sortBy: 'tanggalSeleksi',
      sortOrder: 'DESC',
      dateFrom: '',
      dateTo: '',
      batchId: ''
    };
    updateURL(defaultFilters, 1);
  };

  const calculateAnalytics = (data) => {
    // Monthly trends
    const monthlyData = {};
    data.forEach(item => {
      const month = new Date(item.tanggalSeleksi).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, accepted: 0, rejected: 0 };
      }
      monthlyData[month].total++;
      if (item.statusKelulusan === 'Terima') {
        monthlyData[month].accepted++;
      } else {
        monthlyData[month].rejected++;
      }
    });

    // IPK distribution
    const ipkRanges = { 'Sangat Baik (≥3.5)': 0, 'Baik (3.0-3.49)': 0, 'Cukup (<3.0)': 0 };
    const ipkAcceptance = { 'Sangat Baik (≥3.5)': 0, 'Baik (3.0-3.49)': 0, 'Cukup (<3.0)': 0 };
    
    data.forEach(item => {
      let range;
      if (item.ipk >= 3.5) range = 'Sangat Baik (≥3.5)';
      else if (item.ipk >= 3.0) range = 'Baik (3.0-3.49)';
      else range = 'Cukup (<3.0)';
      
      ipkRanges[range]++;
      if (item.statusKelulusan === 'Terima') {
        ipkAcceptance[range]++;
      }
    });

    setAnalytics({
      monthlyTrends: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })),
      ipkDistribution: ipkRanges,
      ipkAcceptance: ipkAcceptance
    });
  };

  const getAcceptanceRate = () => {
    if (summary.total === 0) return 0;
    return ((summary.Terima / summary.total) * 100).toFixed(1);
  };

  // Generate meaningful decision reasons based on attributes
  const generateDecisionReason = (item) => {
    if (!item) return 'Tidak ada keterangan';
    
    const positiveFactors = [];
    const negativeFactors = [];
    
    // IPK evaluation
    if (item.ipk >= 3.5) {
      positiveFactors.push('IPK sangat baik (≥3.5)');
    } else if (item.ipk >= 3.0) {
      positiveFactors.push('IPK baik (≥3.0)');
    } else {
      negativeFactors.push('IPK kurang memadai (<3.0)');
    }
    
    // Income evaluation (assuming lower income is better for scholarship)
    if (item.penghasilanOrtu <= 2000000) {
      positiveFactors.push('penghasilan orang tua rendah');
    } else if (item.penghasilanOrtu <= 5000000) {
      // neutral factor
    } else {
      negativeFactors.push('penghasilan orang tua tinggi');
    }
    
    // Family dependents
    if (item.jmlTanggungan >= 3) {
      positiveFactors.push('tanggungan keluarga banyak');
    } else {
      negativeFactors.push('tanggungan keluarga sedikit');
    }
    
    // Organization participation
    if (item.ikutOrganisasi) {
      positiveFactors.push('aktif dalam organisasi');
    } else {
      negativeFactors.push('tidak aktif dalam organisasi');
    }
    
    // UKM participation
    if (item.ikutUKM) {
      positiveFactors.push('aktif dalam UKM');
    } else {
      negativeFactors.push('tidak aktif dalam UKM');
    }
    
    // Generate reason based on decision
    if (item.statusKelulusan === 'Terima') {
      const mainReasons = positiveFactors.slice(0, 2).join(', ');
      return `Diterima karena memiliki ${mainReasons}${positiveFactors.length > 2 ? ' dan kriteria lainnya' : ''}`;
    } else {
      const mainReasons = negativeFactors.slice(0, 2).join(', ');
      return `Ditolak karena ${mainReasons}${negativeFactors.length > 2 ? ' dan tidak memenuhi kriteria lainnya' : ''}`;
    }
  };

  const exportAdvancedReport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Membuat laporan lengkap...');
    
    try {
      const allData = await reportService.getAllSelectionResults({ ...filters, fetchAll: 'true' });
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      
      // Cover page
      doc.setFontSize(20);
      doc.text('LAPORAN ANALISIS SELEKSI BEASISWA', 40, 60);
      doc.setFontSize(12);
      doc.text(`Periode: ${filters.dateFrom || 'Semua'} - ${filters.dateTo || 'Sekarang'}`, 40, 90);
      doc.text(`Tanggal Dibuat: ${new Date().toLocaleDateString('id-ID')}`, 40, 110);
      
      // Summary statistics
      doc.setFontSize(16);
      doc.text('RINGKASAN STATISTIK', 40, 150);
      doc.setFontSize(12);
      doc.text(`Total Pendaftar: ${summary.total}`, 40, 180);
      doc.text(`Diterima: ${summary.Terima} (${getAcceptanceRate()}%)`, 40, 200);
      doc.text(`Ditolak: ${summary.Tidak} (${(100 - getAcceptanceRate()).toFixed(1)}%)`, 40, 220);
      
      // Add detailed table on new page
      doc.addPage();
      doc.setFontSize(16);
      doc.text('DATA DETAIL SELEKSI', 40, 40);
      
      const tableData = allData.results.map(item => [
        item.namaPendaftar,
        item.ipk?.toFixed(2),
        item.penghasilanOrtu?.toLocaleString(),
        item.jmlTanggungan,
        item.ikutOrganisasi ? 'Ya' : 'Tidak',
        item.ikutUKM ? 'Ya' : 'Tidak',
        item.statusKelulusan,
        generateDecisionReason(item)
      ]);
      
      autoTable(doc, {
        head: [['Nama', 'IPK', 'Penghasilan', 'Tanggungan', 'Organisasi', 'UKM', 'Status', 'Alasan']],
        body: tableData,
        startY: 60,
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [52, 152, 219] },
        columnStyles: { 
          7: { cellWidth: 120 } // Alasan column wider
        }
      });
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      doc.save(`Laporan_Analisis_Seleksi_${timestamp}.pdf`);
      
      toast.update(toastId, { render: 'Laporan analisis berhasil dibuat!', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (err) {
      toast.update(toastId, { render: 'Gagal membuat laporan: ' + err.message, type: 'error', isLoading: false, autoClose: 5000 });
    } finally {
      setIsExporting(false);
    }
  };
  
  const exportData = async (format) => {
    if (totalItems === 0 && !isLoading) {
      toast.info("Tidak ada data untuk diekspor.");
      return;
    }
    setIsExporting(true);
    const toastId = toast.loading(`Mempersiapkan data untuk ekspor ${format.toUpperCase()}...`);
    try {
      const allFilteredData = await reportService.getAllSelectionResults({ ...filters, fetchAll: 'true' });
      if (!allFilteredData.results || allFilteredData.results.length === 0) {
          toast.update(toastId, {render: "Tidak ditemukan data untuk diekspor.", type: "info", isLoading: false, autoClose: 3000});
          return;
      }
      toast.update(toastId, {render: `Membuat dokumen ${format.toUpperCase()}...`, isLoading: true});
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const dataToExport = allFilteredData.results.map(item => ({
        'Nama Pendaftar': item.namaPendaftar, 
        'IPK': item.ipk, 
        'Penghasilan Ortu': item.penghasilanOrtu, 
        'Jml Tanggungan': item.jmlTanggungan, 
        'Ikut Organisasi': item.ikutOrganisasi ? 'Ya' : 'Tidak', 
        'Ikut UKM': item.ikutUKM ? 'Ya' : 'Tidak',
        'Status Kelulusan': item.statusKelulusan, 
        'Alasan Keputusan': generateDecisionReason(item),
        'Tanggal Seleksi': new Date(item.tanggalSeleksi).toLocaleDateString('id-ID'),
      }));

      if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Hasil Seleksi");
        XLSX.writeFile(workbook, `Laporan_Seleksi_${timestamp}.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        
        // Add title
        doc.setFontSize(16);
        doc.text('Laporan Hasil Seleksi Beasiswa', 40, 40);
        
        // Add summary info
        doc.setFontSize(10);
        doc.text(`Total Data: ${summary.total}   Diterima: ${summary.Terima}   Tidak Diterima: ${summary.Tidak}`, 40, 60);
        doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 40, 75);
        
        autoTable(doc, {
            head: [Object.keys(dataToExport[0])], 
            body: dataToExport.map(Object.values), 
            startY: 90, 
            theme: 'striped',
            styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' }, 
            headStyles: { fillColor: [22, 160, 133], fontSize: 8 },
            columnStyles: { 7: { cellWidth: 150 } } 
        });
        doc.save(`Laporan_Seleksi_${timestamp}.pdf`);
      }
      toast.update(toastId, {render: `Dokumen ${format.toUpperCase()} berhasil dibuat!`, type: "success", isLoading: false, autoClose: 3000});
    } catch (err) {
        toast.update(toastId, {render: `Gagal mengekspor data: ${err.message || "Error"}`, type: "error", isLoading: false, autoClose: 5000});
    } finally {
        setIsExporting(false);
    }
  };
  
  const SortIcon = ({ fieldName }) => {
    if (filters.sortBy !== fieldName) return null;
    const isNumeric = ['ipk', 'jmlTanggungan'].includes(fieldName);
    if (isNumeric) {
        return filters.sortOrder === 'ASC' ? <SortNumericUp size={14} className="ms-1 text-primary"/> : <SortNumericDown size={14} className="ms-1 text-primary"/>;
    }
    return filters.sortOrder === 'ASC' ? <SortAlphaUp size={14} className="ms-1 text-primary"/> : <SortAlphaDown size={14} className="ms-1 text-primary"/>;
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1 || isLoading} />
      );
    }

    // Previous page
    items.push(
      <Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} />
    );

    // Page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
          disabled={isLoading}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Next page
    items.push(
      <Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} />
    );

    // Last page
    if (endPage < totalPages) {
      items.push(
        <Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || isLoading} />
      );
    }

    return items;
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bolder text-dark mb-1">Laporan & Analisis Seleksi</h1>
          <p className="text-muted mb-0">Dashboard komprehensif hasil seleksi beasiswa</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-info" 
            onClick={() => setShowAnalytics(true)}
            disabled={isLoading || totalItems === 0}
          >
            <PieChart className="me-2" /> Analytics
          </Button>
          <ButtonGroup>
            <Button variant="success" onClick={() => exportData('excel')} disabled={isLoading || isExporting || totalItems === 0}>
              <FileEarmarkSpreadsheetFill className="me-2"/>Excel
            </Button>
            <Button variant="danger" onClick={() => exportData('pdf')} disabled={isLoading || isExporting || totalItems === 0}>
              <FiletypePdf className="me-2"/>PDF
            </Button>
            <Button variant="primary" onClick={exportAdvancedReport} disabled={isLoading || isExporting || totalItems === 0}>
              <Download className="me-2"/>Laporan Lengkap
            </Button>
          </ButtonGroup>
        </div>
      </div>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Card className="shadow-sm mb-4 border-0">
        <Card.Header className="bg-light border-bottom-0 pt-3 pb-2 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="fw-medium mb-0 d-flex align-items-center">
              <FilterSquare className="me-2 text-primary"/>Filter Laporan
            </h5>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={clearFilters}
              disabled={isLoading || isExporting}
            >
              <i className="bi bi-x-circle me-2"></i>
              Reset Filter
            </Button>
          </div>
        </Card.Header> 
        <Card.Body className="p-4"> 
            <BootstrapForm> 
                <Row className="g-3"> 
                    <Col xs={12} md={4}> 
                        <BootstrapForm.Group controlId="statusFilter">
                            <BootstrapForm.Label className="small fw-medium">Status Kelulusan</BootstrapForm.Label>
                            <BootstrapForm.Select 
                                name="status" 
                                value={filters.status} 
                                onChange={handleFilterChange} 
                                disabled={isLoading || isExporting}
                            >
                                <option value="semua">Semua Status</option>
                                <option value="Terima">Terima</option>
                                <option value="Tidak">Tidak</option>
                            </BootstrapForm.Select>
                        </BootstrapForm.Group> 
                    </Col>
                    <Col xs={12} md={4}>
                        <BootstrapForm.Group controlId="batchFilter">
                            <BootstrapForm.Label className="small fw-medium">Batch Seleksi</BootstrapForm.Label>
                            <BootstrapForm.Select
                                name="batchId"
                                value={filters.batchId}
                                onChange={handleFilterChange}
                                disabled={isLoading || isExporting}
                            >
                                <option value="">Semua Batch</option>
                                {batches.map(batch => (
                                    <option key={batch.id} value={batch.id}>
                                        {batch.name || `Batch #${batch.id}`} ({new Date(batch.createdAt).toLocaleDateString('id-ID')})
                                    </option>
                                ))}
                            </BootstrapForm.Select>
                        </BootstrapForm.Group>
                    </Col>
                    <Col xs={12} md={4}>
                        <BootstrapForm.Group controlId="dateFromFilter">
                            <BootstrapForm.Label className="small fw-medium">Dari Tanggal</BootstrapForm.Label>
                            <BootstrapForm.Control
                                type="date"
                                name="dateFrom"
                                value={filters.dateFrom}
                                onChange={handleFilterChange}
                                disabled={isLoading || isExporting}
                            />
                        </BootstrapForm.Group>
                    </Col>
                    <Col xs={12} md={4}>
                        <BootstrapForm.Group controlId="dateToFilter">
                            <BootstrapForm.Label className="small fw-medium">Sampai Tanggal</BootstrapForm.Label>
                            <BootstrapForm.Control
                                type="date"
                                name="dateTo"
                                value={filters.dateTo}
                                onChange={handleFilterChange}
                                disabled={isLoading || isExporting}
                            />
                        </BootstrapForm.Group>
                    </Col>
                    <Col xs={12} md={8}>
                        <BootstrapForm.Group controlId="searchTerm">
                            <BootstrapForm.Label className="small fw-medium">Cari Nama Mahasiswa</BootstrapForm.Label>
                            <InputGroup>
                                <InputGroup.Text><Search /></InputGroup.Text>
                                <BootstrapForm.Control
                                    type="text"
                                    name="searchTerm"
                                    placeholder="Ketik nama mahasiswa..."
                                    value={filters.searchTerm}
                                    onChange={handleFilterChange}
                                    disabled={isLoading || isExporting}
                                />
                            </InputGroup>
                        </BootstrapForm.Group>
                    </Col>
                </Row>
            </BootstrapForm> 
        </Card.Body> 
      </Card>

      {/* Enhanced Statistics Cards */}
      <Row className="g-4 mb-4">
        <Col lg={3} md={6}>
          <Card className="stats-card border-0 h-100">
            <Card.Body className="text-center p-4">
              <div className="stats-icon bg-primary bg-opacity-10 rounded-circle mx-auto mb-3">
                <People className="text-primary" size={24} />
              </div>
              <h6 className="text-muted mb-1">Total Pendaftar</h6>
              <div className="fs-2 fw-bold text-primary mb-2">
                {isLoading ? <Spinner size="sm" /> : summary.total.toLocaleString()}
              </div>
              <small className="text-muted">Berdasarkan filter aktif</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="stats-card border-0 h-100">
            <Card.Body className="text-center p-4">
              <div className="stats-icon bg-success bg-opacity-10 rounded-circle mx-auto mb-3">
                <CheckCircleFill className="text-success" size={24} />
              </div>
              <h6 className="text-muted mb-1">Diterima</h6>
              <div className="fs-2 fw-bold text-success mb-2">
                {isLoading ? <Spinner size="sm" /> : summary.Terima.toLocaleString()}
              </div>
              <Badge bg="success" className="fs-6">{getAcceptanceRate()}%</Badge>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="stats-card border-0 h-100">
            <Card.Body className="text-center p-4">
              <div className="stats-icon bg-danger bg-opacity-10 rounded-circle mx-auto mb-3">
                <XCircleFill className="text-danger" size={24} />
              </div>
              <h6 className="text-muted mb-1">Ditolak</h6>
              <div className="fs-2 fw-bold text-danger mb-2">
                {isLoading ? <Spinner size="sm" /> : summary.Tidak.toLocaleString()}
              </div>
              <Badge bg="danger" className="fs-6">{(100 - getAcceptanceRate()).toFixed(1)}%</Badge>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="stats-card border-0 h-100">
            <Card.Body className="text-center p-4">
              <div className="stats-icon bg-info bg-opacity-10 rounded-circle mx-auto mb-3">
                <ArrowUpShort className="text-info" size={24} />
              </div>
              <h6 className="text-muted mb-1">Tingkat Penerimaan</h6>
              <div className="fs-2 fw-bold text-info mb-2">
                {isLoading ? <Spinner size="sm" /> : `${getAcceptanceRate()}%`}
              </div>
              <ProgressBar 
                variant="info" 
                now={getAcceptanceRate()} 
                style={{ height: '4px' }}
                className="rounded-pill"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {selectedBatch && (
        <Card className="shadow-sm mb-4 border-0">
          <Card.Header className="bg-gradient-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center">
                <BarChartLineFill className="me-2" />
                Informasi Batch: {selectedBatch.name || `Batch #${selectedBatch.id}`}
              </h5>
              <Badge 
                bg={selectedBatch.status === 'completed' ? 'success' : 'warning'} 
                className="fs-6"
              >
                {selectedBatch.status === 'completed' ? 'Selesai' : 'Dalam Proses'}
              </Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-4">
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <Calendar className="text-primary mb-2" size={20} />
                  <div className="text-muted small mb-1">Tanggal Dibuat</div>
                  <div className="fw-bold">
                    {selectedBatch.createdAt ? 
                      new Date(selectedBatch.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long', 
                        year: 'numeric'
                      }) : 'Tidak tersedia'
                    }
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <People className="text-info mb-2" size={20} />
                  <div className="text-muted small mb-1">Total Data Diproses</div>
                  <div className="fw-bold text-info">
                    {summary.total > 0 ? summary.total.toLocaleString() : (selectedBatch.totalData || 0).toLocaleString()}
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <Award className="text-success mb-2" size={20} />
                  <div className="text-muted small mb-1">Akurasi Model</div>
                  <div className="fw-bold text-success">
                    {selectedBatch.modelAccuracy ? 
                      `${(selectedBatch.modelAccuracy * 100).toFixed(1)}%` : 
                      summary.total > 0 ? `${getAcceptanceRate()}%` : 'Belum tersedia'
                    }
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <CheckCircleFill className="text-primary mb-2" size={20} />
                  <div className="text-muted small mb-1">Tingkat Penerimaan</div>
                  <div className="fw-bold text-primary">
                    {summary.total > 0 ? 
                      `${summary.Terima}/${summary.total} (${getAcceptanceRate()}%)` : 
                      'Belum ada data'
                    }
                  </div>
                </div>
              </Col>
            </Row>
            
            {summary.total === 0 && (
              <Alert variant="warning" className="mt-3 mb-0">
                <InfoCircleFill className="me-2" />
                <strong>Perhatian:</strong> Batch ini belum memiliki data hasil seleksi. 
                Pastikan proses seleksi telah dijalankan untuk batch ini.
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Main Data Table */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">Data Hasil Seleksi</h5>
          {reportData.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <Badge bg="primary" className="fs-6">
                {totalItems.toLocaleString()} total data
              </Badge>
              <Button variant="outline-secondary" size="sm" onClick={() => window.print()}>
                <Printer size={14} className="me-1" /> Print
              </Button>
            </div>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center p-5">
              <div className="loading-spinner mb-3">
                <Spinner style={{width: '3rem', height: '3rem'}} className="text-primary" />
              </div>
              <h6 className="text-muted">Memuat data laporan...</h6>
              <p className="text-muted small mb-0">Mohon tunggu sebentar</p>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center p-5">
              <InfoCircleFill size={48} className="text-muted mb-3" />
              <h6 className="text-muted mb-2">Tidak Ada Data</h6>
              <p className="text-muted mb-3">Tidak ada data yang sesuai dengan filter yang dipilih.</p>
              <Button variant="outline-primary" onClick={clearFilters}>
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th className="text-center" style={{width: '50px'}}>No</th>
                    <th onClick={() => handleSortChange('namaPendaftar')} className="sortable-header">
                      Nama <SortIcon fieldName="namaPendaftar"/>
                    </th>
                    <th onClick={() => handleSortChange('ipk')} className="sortable-header text-center" style={{width: '80px'}}>
                      IPK <SortIcon fieldName="ipk"/>
                    </th>
                    <th style={{width: '100px'}}>Penghasilan</th>
                    <th onClick={() => handleSortChange('jmlTanggungan')} className="sortable-header text-center" style={{width: '80px'}}>
                      Tanggungan <SortIcon fieldName="jmlTanggungan"/>
                    </th>
                    <th className="text-center" style={{width: '80px'}}>Organisasi</th>
                    <th className="text-center" style={{width: '80px'}}>UKM</th>
                    <th onClick={() => handleSortChange('statusKelulusan')} className="sortable-header text-center" style={{width: '100px'}}>
                      Status <SortIcon fieldName="statusKelulusan"/>
                    </th>
                    <th style={{minWidth: '200px'}}>Alasan Keputusan</th>
                    <th onClick={() => handleSortChange('tanggalSeleksi')} className="sortable-header" style={{width: '100px'}}>
                      Tanggal <SortIcon fieldName="tanggalSeleksi"/>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={item.id} className="table-row-hover">
                      <td className="text-center text-muted small">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="fw-medium">{item.namaPendaftar}</td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark fs-6">
                          {item.ipk?.toFixed(2)}
                        </span>
                      </td>
                      <td className="small">
                        <span className="badge bg-light text-dark fs-6">
                          {item.penghasilanOrtu?.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark fs-6">
                          {item.jmlTanggungan}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark fs-6">
                          {item.ikutOrganisasi ? 'Ya' : 'Tidak'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark fs-6">
                          {item.ikutUKM ? 'Ya' : 'Tidak'}
                        </span>
                      </td>
                      <td className="text-center">
                        <Badge 
                          bg={item.statusKelulusan === 'Terima' ? 'success' : 'danger'}
                          className="fs-6"
                        >
                          {item.statusKelulusan === 'Terima' ? (
                            <><CheckCircleFill className="me-1" size={12} />Diterima</>
                          ) : (
                            <><XCircleFill className="me-1" size={12} />Ditolak</>
                          )}
                        </Badge>
                      </td>
                      <td className="small text-muted">
                        {generateDecisionReason(item)}
                      </td>
                      <td className="small">
                        <div className="d-flex align-items-center">
                          <Calendar size={12} className="me-1 text-muted" />
                          {new Date(item.tanggalSeleksi).toLocaleDateString('id-ID', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        
        {reportData.length > 0 && totalPages > 1 && !isLoading && (
          <Card.Footer className="bg-light d-flex justify-content-between align-items-center py-3">
            <div className="text-muted small">
              Menampilkan <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> dari <strong>{totalItems.toLocaleString()}</strong> hasil
            </div>
            <Pagination size="sm" className="mb-0">
              {renderPaginationItems()}
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* Analytics Modal */}
      <Modal show={showAnalytics} onHide={() => setShowAnalytics(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <PieChart className="me-2" />
            Analytics & Insights
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab eventKey="overview" title="Overview">
              <Row className="g-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Distribusi Status</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Diterima</span>
                          <span>{summary.Terima} ({getAcceptanceRate()}%)</span>
                        </div>
                        <ProgressBar variant="success" now={getAcceptanceRate()} style={{height: '8px'}} />
                      </div>
                      <div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Ditolak</span>
                          <span>{summary.Tidak} ({(100 - getAcceptanceRate()).toFixed(1)}%)</span>
                        </div>
                        <ProgressBar variant="danger" now={100 - getAcceptanceRate()} style={{height: '8px'}} />
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
                      {Object.entries(analytics.ipkDistribution || {}).map(([range, count]) => {
                        const percentage = summary.total > 0 ? ((count / summary.total) * 100).toFixed(1) : 0;
                        return (
                          <div key={range} className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small">{range}</span>
                              <span className="small">{count} ({percentage}%)</span>
                            </div>
                            <ProgressBar 
                              variant={range.includes('Sangat Baik') ? 'success' : range.includes('Baik') ? 'warning' : 'danger'} 
                              now={percentage} 
                              style={{height: '6px'}} 
                            />
                          </div>
                        );
                      })}
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
                            <th>Total</th>
                            <th>Diterima</th>
                            <th>Ditolak</th>
                            <th>Tingkat Penerimaan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.monthlyTrends.map(trend => (
                            <tr key={trend.month}>
                              <td>{trend.month}</td>
                              <td>{trend.total}</td>
                              <td className="text-success">{trend.accepted}</td>
                              <td className="text-danger">{trend.rejected}</td>
                              <td>
                                <Badge bg="info">
                                  {((trend.accepted / trend.total) * 100).toFixed(1)}%
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

export default ReportPage;