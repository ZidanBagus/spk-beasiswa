// src/pages/QueryToolPage.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import apiClient from '../services/apiClient';

const QueryToolPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const executeDuplicateCleanup = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data duplikasi (ID 13-24) dari tabel SelectionAttributes?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/query-tool', {
        action: 'delete_duplicates'
      });

      setResult(response.data);
      toast.success('Query berhasil dieksekusi!');
    } catch (error) {
      console.error('Query error:', error);
      toast.error('Gagal mengeksekusi query: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4 className="mb-0">🔧 Query Tool - Database Management</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="warning">
                <strong>⚠️ Peringatan:</strong> Tool ini untuk mengelola database. Gunakan dengan hati-hati!
              </Alert>

              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>
                      <h6>Hapus Data Duplikasi</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted">
                        Menghapus data duplikasi di tabel SelectionAttributes (ID 13-24)
                      </p>
                      <Button 
                        variant="danger" 
                        onClick={executeDuplicateCleanup}
                        disabled={loading}
                      >
                        {loading ? 'Memproses...' : 'Hapus Duplikasi'}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  {result && (
                    <Card>
                      <Card.Header>
                        <h6>Hasil Query</h6>
                      </Card.Header>
                      <Card.Body>
                        <Alert variant="success">
                          <strong>✅ {result.message}</strong>
                        </Alert>
                        <div className="mb-2">
                          <strong>Query:</strong>
                          <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={result.query} 
                            readOnly 
                            className="mt-1"
                          />
                        </div>
                        <p className="mb-1"><strong>Affected Rows:</strong> {result.affected_rows}</p>
                        <p className="mb-0"><strong>Description:</strong> {result.description}</p>
                      </Card.Body>
                    </Card>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default QueryToolPage;