import React from 'react';
import { Modal, Table, Badge, Button } from 'react-bootstrap';
import { FileEarmarkText, Download } from 'react-bootstrap-icons';

const DrillDownModal = ({ show, onHide, title, data, category }) => {
    const handleExport = () => {
        // Mock export functionality
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Nama,IPK,Penghasilan,Status\n"
            + data.map(item => `${item.nama},${item.ipk},${item.penghasilan},${item.status}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${category}_detail.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <FileEarmarkText className="me-2" />
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <Badge bg="primary" className="me-2">{data?.length || 0} pendaftar</Badge>
                        <small className="text-muted">dalam kategori {category}</small>
                    </div>
                    <Button variant="outline-success" size="sm" onClick={handleExport}>
                        <Download className="me-1" />
                        Export CSV
                    </Button>
                </div>
                
                <Table striped hover responsive>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama</th>
                            <th>IPK</th>
                            <th>Penghasilan</th>
                            <th>Organisasi</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.nama || 'N/A'}</td>
                                <td>{item.ipk || 'N/A'}</td>
                                <td>{item.penghasilan || 'N/A'}</td>
                                <td>
                                    <Badge bg={item.organisasi === 'Ya' ? 'success' : 'secondary'}>
                                        {item.organisasi || 'N/A'}
                                    </Badge>
                                </td>
                                <td>
                                    <Badge bg={item.status === 'Terima' ? 'success' : 'danger'}>
                                        {item.status || 'N/A'}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                
                {(!data || data.length === 0) && (
                    <div className="text-center py-4 text-muted">
                        Tidak ada data untuk ditampilkan
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default DrillDownModal;