import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
    Table, Button, ButtonGroup, Form as BootstrapForm, Card,
    Row, Col, Alert, Spinner, Pagination, InputGroup, Container
} from 'react-bootstrap';
import {
    FilterSquare, BarChartLineFill, CheckCircleFill, XCircleFill, InfoCircleFill,
    FiletypePdf, FileEarmarkSpreadsheetFill, SortAlphaDown, SortAlphaUp, SortNumericDown, SortNumericUp, Search
} from 'react-bootstrap-icons';
import reportService from '../services/reportService';
import { toast } from 'react-toastify';

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
    sortOrder: getQueryParam('sortOrder') || 'DESC'
  });

  const [summary, setSummary] = useState({ total: 0, Terima: 0, Tidak: 0 });
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
        // Menyesuaikan dengan label baru 'Terima' dan 'Tidak'
        setSummary({
          total: data.summary.total,
          Terima: data.summary.recommended, // Menggunakan recommended/notRecommended dari backend
          Tidak: data.summary.notRecommended
        });
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
        sortOrder: getQueryParam('sortOrder') || 'DESC'
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
        'Nama Pendaftar': item.namaPendaftar, 'IPK': item.ipk, 'Penghasilan Ortu': item.penghasilanOrtu, 
        'Jml Tanggungan': item.jmlTanggungan, 'Ikut Organisasi': item.ikutOrganisasi, 'Ikut UKM': item.ikutUKM,
        'Status Kelulusan': item.statusKelulusan, 'Alasan Keputusan': item.alasanKeputusan || '-',
        'Tanggal Seleksi': new Date(item.tanggalSeleksi).toLocaleDateString('id-ID'),
      }));

      if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Hasil Seleksi");
        XLSX.writeFile(workbook, `Laporan_Seleksi_${timestamp}.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        autoTable(doc, {
            head: [Object.keys(dataToExport[0])], 
            body: dataToExport.map(Object.values), 
            startY: 90, theme: 'striped',
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

  const renderPaginationItems = () => { /* ... (Fungsi ini tidak perlu diubah) ... */ };

  return (
    <Container fluid>
      <Row className="align-items-center mb-4 g-3"> 
        <Col md> <h1 className="h2 fw-bolder text-dark mb-0">Laporan Hasil Seleksi</h1> </Col> 
        <Col md="auto"> 
            <ButtonGroup>
                <Button variant="success" onClick={() => exportData('excel')} disabled={isLoading || isExporting || totalItems === 0}><FileEarmarkSpreadsheetFill className="me-2"/>Ekspor Excel</Button>
                <Button variant="danger" onClick={() => exportData('pdf')} disabled={isLoading || isExporting || totalItems === 0}><FiletypePdf className="me-2"/>Ekspor PDF</Button>
            </ButtonGroup>
        </Col> 
      </Row>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Card className="shadow-sm mb-4 border-0">
        <Card.Header className="bg-light border-bottom-0 pt-3 pb-2 px-4"><h5 className="fw-medium mb-0 d-flex align-items-center"><FilterSquare className="me-2 text-primary"/>Filter Laporan</h5></Card.Header> 
        <Card.Body className="p-4"> 
            <BootstrapForm> 
                <Row className="g-3 align-items-end"> 
                    <Col xs={12} md={6} lg={4}> 
                        <BootstrapForm.Group controlId="statusFilter"><BootstrapForm.Label className="small fw-medium">Status Kelulusan</BootstrapForm.Label><BootstrapForm.Select name="status" value={filters.status} onChange={handleFilterChange} disabled={isLoading || isExporting}><option value="semua">Semua Status</option><option value="Terima">Terima</option><option value="Tidak">Tidak</option></BootstrapForm.Select></BootstrapForm.Group> 
                    </Col> 
                    <Col xs={12} md={6} lg={8}> 
                        <BootstrapForm.Group controlId="searchTerm"><BootstrapForm.Label className="small fw-medium">Cari</BootstrapForm.Label><InputGroup><InputGroup.Text><Search /></InputGroup.Text><BootstrapForm.Control type="text" name="searchTerm" placeholder="Cari nama, prodi, dll..." value={filters.searchTerm} onChange={handleFilterChange} disabled={isLoading || isExporting}/></InputGroup></BootstrapForm.Group> 
                    </Col> 
                </Row> 
            </BootstrapForm> 
        </Card.Body> 
      </Card>

      <Row className="g-3 mb-4"> 
        <Col md={4}><Card bg="primary" text="white" className="shadow-sm border-0 h-100"><Card.Body className="text-center py-3"><BarChartLineFill size={28} className="mb-2"/><Card.Title as="h6">Total Hasil (Filter)</Card.Title>{isLoading && summary.total === 0 ? <Spinner size="sm"/> : <div className="fs-4 fw-bold">{summary.total}</div>}</Card.Body></Card></Col> 
        <Col md={4}><Card bg="success" text="white" className="shadow-sm border-0 h-100"><Card.Body className="text-center py-3"><CheckCircleFill size={28} className="mb-2"/><Card.Title as="h6">Diterima (Filter)</Card.Title>{isLoading && summary.total === 0 ? <Spinner size="sm"/> : <div className="fs-4 fw-bold">{summary.Terima}</div>}</Card.Body></Card></Col> 
        <Col md={4}><Card bg="danger" text="white" className="shadow-sm border-0 h-100"><Card.Body className="text-center py-3"><XCircleFill size={28} className="mb-2"/><Card.Title as="h6">Ditolak (Filter)</Card.Title>{isLoading && summary.total === 0 ? <Spinner size="sm"/> : <div className="fs-4 fw-bold">{summary.Tidak}</div>}</Card.Body></Card></Col>
      </Row>
      
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
            {isLoading ? ( <div className="text-center p-5"><Spinner style={{width: '3rem', height: '3rem'}} /><p className="mt-3 text-muted">Memuat data...</p></div> ) : 
            reportData.length === 0 ? ( <Alert variant="light" className="text-center m-3"><InfoCircleFill size={28} className="mb-2 text-muted"/> <p className="mb-0">Tidak ada data yang sesuai dengan filter saat ini.</p> </Alert> ) : 
            ( <div className="table-responsive">
                <Table striped bordered hover className="mb-0 align-middle small"> 
                    <thead className="table-light"> 
                        <tr> 
                            <th className="text-center">No</th> 
                            <th onClick={() => handleSortChange('namaPendaftar')} className="cursor-pointer">Nama <SortIcon fieldName="namaPendaftar"/></th> 
                            <th onClick={() => handleSortChange('ipk')} className="cursor-pointer text-center">IPK <SortIcon fieldName="ipk"/></th> 
                            <th>Penghasilan</th> 
                            <th onClick={() => handleSortChange('jmlTanggungan')} className="cursor-pointer text-center">Tanggungan <SortIcon fieldName="jmlTanggungan"/></th> 
                            <th onClick={() => handleSortChange('statusKelulusan')} className="cursor-pointer">Status <SortIcon fieldName="statusKelulusan"/></th> 
                            <th style={{minWidth: '250px'}}>Alasan Keputusan</th> 
                            <th onClick={() => handleSortChange('tanggalSeleksi')} className="cursor-pointer">Tgl Seleksi <SortIcon fieldName="tanggalSeleksi"/></th> 
                        </tr> 
                    </thead>
                    <tbody> 
                        {reportData.map((item, index) => ( 
                            <tr key={item.id}> 
                                <td className="text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td> 
                                <td className="fw-medium">{item.namaPendaftar}</td> 
                                <td className="text-center">{item.ipk?.toFixed(2)}</td> 
                                <td>{item.penghasilanOrtu}</td> 
                                <td className="text-center">{item.jmlTanggungan}</td> 
                                <td style={{ color: item.statusKelulusan === 'Terima' ? 'var(--bs-success)' : 'var(--bs-danger)', fontWeight: 'bold' }}>{item.statusKelulusan}</td> 
                                <td className="small">{item.alasanKeputusan || '-'}</td> 
                                <td>{new Date(item.tanggalSeleksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric'})}</td> 
                            </tr> 
                        ))} 
                    </tbody>
                </Table>
            </div>
            )}
        </Card.Body>
        {reportData.length > 0 && totalPages > 1 && !isLoading && (
            <Card.Footer className="bg-light border-top-0 py-2 px-4 d-flex justify-content-between align-items-center"> 
                <div className="small text-muted">Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} hasil</div>
                <Pagination size="sm" className="mb-0">{renderPaginationItems()}</Pagination>
            </Card.Footer>
        )}
      </Card>
    </Container>
  );
};

export default ReportPage;