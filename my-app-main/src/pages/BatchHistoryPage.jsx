// src/pages/BatchHistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Card, Row, Col } from 'react-bootstrap';
import { ClockHistory, EyeFill } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import batchService from '../services/batchService';
import { toast } from 'react-toastify';

const BatchHistoryPage = () => {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await batchService.getAll();
      setBatches(data);
    } catch (error) {
      toast.error(error.message || 'Gagal memuat riwayat pengujian.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return (
    <>
      <Row className="align-items-center mb-4">
        <Col><h1 className="h2 fw-bolder text-dark mb-0">Riwayat Pengujian Model</h1></Col>
      </Row>
      <Card className="shadow-sm">
        <Card.Header><h5 className="mb-0 d-flex align-items-center"><ClockHistory className="me-2"/>Daftar Sesi Pengujian</h5></Card.Header>
        <Card.Body>
          {isLoading ? <div className="text-center p-5"><Spinner/></div> :
            batches.length === 0 ? (
                <Alert variant="info">Belum ada riwayat pengujian yang tersimpan. Jalankan "Uji Model" atau "Uji Seluruh Data" di halaman Proses Seleksi untuk membuat riwayat baru.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead className="table-light">
                        <tr>
                            <th>Nama Batch</th>
                            <th className="text-center">Akurasi</th>
                            <th>Dijalankan Oleh</th>
                            <th>Tanggal</th>
                            <th className="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.map(batch => (
                        <tr key={batch.id}>
                            <td className="fw-medium">{batch.namaBatch}</td>
                            <td className="text-center">{batch.akurasi ? `${batch.akurasi}%` : '-'}</td>
                            <td>{batch.user ? batch.user.namaLengkap : 'N/A'}</td>
                            <td>{new Date(batch.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                            <td className="text-center">
                                <Button as={Link} to={`/reports?batchId=${batch.id}`} variant="outline-primary" size="sm" title="Lihat Detail Laporan">
                                    <EyeFill/> Lihat Detail
                                </Button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </Table>
            )
          }
        </Card.Body>
      </Card>
    </>
  );
};

export default BatchHistoryPage;
