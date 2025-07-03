import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Spinner, Alert, Row, Col, Badge, ProgressBar, Container, Modal } from 'react-bootstrap';
import { Save, CheckCircleFill, ExclamationTriangleFill, InfoCircle, Sliders, Eye, BarChart } from 'react-bootstrap-icons';
import { useAttributes } from '../contexts/AttributeContext';
import attributeService from '../services/attributeService';
import { toast } from 'react-toastify';
import './AttributeSelectionPage.css';

const AttributeSelectionPage = () => {
  const { attributes, setAttributes, isLoadingAttributes, refetchAttributes } = useAttributes();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [attributeStats, setAttributeStats] = useState({});

  const selectedCount = attributes.filter(attr => attr.isSelected).length;
  const isSaveAllowed = selectedCount === 5;
  const progressPercentage = (selectedCount / 5) * 100;

  // Enhanced attribute descriptions
  const attributeDescriptions = {
    ipk: {
      description: 'Indeks Prestasi Kumulatif mahasiswa',
      importance: 'Tinggi',
      example: 'IPK ≥ 3.5 = Baik, IPK < 3.0 = Kurang'
    },
    penghasilanOrtu: {
      description: 'Penghasilan orang tua per bulan',
      importance: 'Tinggi', 
      example: '< 2 juta = Rendah, > 5 juta = Tinggi'
    },
    tanggungan: {
      description: 'Jumlah tanggungan dalam keluarga',
      importance: 'Sedang',
      example: '≥ 3 orang = Banyak, < 3 orang = Sedikit'
    },
    organisasi: {
      description: 'Keaktifan dalam organisasi kemahasiswaan',
      importance: 'Sedang',
      example: 'Aktif = Ya, Tidak Aktif = Tidak'
    },
    prestasi: {
      description: 'Prestasi akademik atau non-akademik',
      importance: 'Sedang',
      example: 'Ada prestasi = Ya, Tidak ada = Tidak'
    }
  };

  const handleToggle = (id) => {
    const currentSelected = attributes.filter(attr => attr.isSelected).length;
    const targetAttr = attributes.find(attr => attr.id === id);
    
    // Prevent selecting more than 5
    if (!targetAttr.isSelected && currentSelected >= 5) {
      toast.warning('Maksimal 5 atribut dapat dipilih!');
      return;
    }
    
    const newAttributes = attributes.map((attr) =>
      attr.id === id ? { ...attr, isSelected: !attr.isSelected } : attr
    );
    setAttributes(newAttributes);
  };

  const handleSave = async () => {
    if (!isSaveAllowed) {
      toast.error("Harus memilih tepat 5 atribut untuk disimpan.");
      return;
    }
    
    setIsSaving(true);
    const dataToSave = attributes.map(({ id, isSelected }) => ({ id, isSelected }));
    
    try {
      const response = await attributeService.updateAttributes(dataToSave);
      toast.success(response.message || 'Konfigurasi atribut berhasil disimpan!');
      await refetchAttributes();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedAttributes = () => {
    return attributes.filter(attr => attr.isSelected);
  };

  const getImportanceColor = (importance) => {
    switch(importance) {
      case 'Tinggi': return 'danger';
      case 'Sedang': return 'warning';
      case 'Rendah': return 'info';
      default: return 'secondary';
    }
  };

  if (isLoadingAttributes && attributes.length === 0) {
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Memuat konfigurasi atribut...</p>
      </Container>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bolder text-dark mb-1">Konfigurasi Atribut Seleksi</h1>
          <p className="text-muted mb-0">Pilih 5 atribut yang akan digunakan dalam algoritma C4.5</p>
        </div>
        <Button 
          variant="outline-info" 
          onClick={() => setShowPreview(true)}
          disabled={selectedCount === 0}
        >
          <Eye className="me-2" /> Preview Seleksi
        </Button>
      </div>

      {/* Progress Card */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-gradient-primary text-white">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Sliders className="me-2" size={20} />
              <h6 className="mb-0 fw-semibold">Progress Seleksi Atribut</h6>
            </div>
            <Badge bg="light" text="dark" className="fs-6">
              {selectedCount}/5
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-medium">Atribut Terpilih</span>
              <span className="text-muted">{progressPercentage.toFixed(0)}%</span>
            </div>
            <ProgressBar 
              now={progressPercentage} 
              variant={isSaveAllowed ? 'success' : 'primary'}
              style={{ height: '8px' }}
              className="rounded-pill"
            />
          </div>
          
          <Alert variant={isSaveAllowed ? 'success' : 'warning'} className="mb-0">
            {isSaveAllowed ? <CheckCircleFill className="me-2" /> : <ExclamationTriangleFill className="me-2" />}
            {isSaveAllowed 
              ? 'Konfigurasi lengkap! Siap untuk menyimpan perubahan.' 
              : `Pilih ${5 - selectedCount} atribut lagi untuk melengkapi konfigurasi.`
            }
          </Alert>
        </Card.Body>
      </Card>

      {/* Attributes Selection */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light">
          <h5 className="fw-medium mb-0 d-flex align-items-center">
            <BarChart className="me-2" />
            Daftar Atribut Tersedia
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-4">
            {attributes.map((attr) => {
              const description = attributeDescriptions[attr.id] || {};
              const isSelected = attr.isSelected;
              
              return (
                <Col key={attr.id} lg={6} xl={4}>
                  <Card className={`h-100 attribute-card ${isSelected ? 'selected' : ''}`}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <h6 className="fw-semibold mb-1">{attr.displayName}</h6>
                          <p className="text-muted small mb-2">{description.description}</p>
                        </div>
                        <Form.Check
                          type="switch"
                          id={`attr-${attr.id}`}
                          checked={isSelected}
                          onChange={() => handleToggle(attr.id)}
                          disabled={isSaving}
                          className="ms-2"
                        />
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge bg={getImportanceColor(description.importance)} className="fs-6">
                          {description.importance || 'Normal'}
                        </Badge>
                        {isSelected && <CheckCircleFill className="text-success" size={16} />}
                      </div>
                      
                      <div className="bg-light p-2 rounded small">
                        <strong>Contoh:</strong> {description.example || 'Tidak ada contoh'}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card.Body>
        
        <Card.Footer className="bg-light d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            <InfoCircle className="me-1" />
            Pilih atribut yang paling relevan untuk proses seleksi beasiswa
          </div>
          <Button 
            variant="primary" 
            size="lg"
            onClick={handleSave} 
            disabled={isLoadingAttributes || isSaving || !isSaveAllowed}
            className="px-4"
          >
            {isSaving ? (
              <>
                <Spinner as="span" size="sm" className="me-2" /> 
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="me-2" />
                Simpan Konfigurasi
              </>
            )}
          </Button>
        </Card.Footer>
      </Card>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Preview Atribut Terpilih</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6>Atribut yang akan digunakan dalam algoritma C4.5:</h6>
          </div>
          {getSelectedAttributes().length > 0 ? (
            <Row className="g-3">
              {getSelectedAttributes().map((attr, index) => {
                const description = attributeDescriptions[attr.id] || {};
                return (
                  <Col key={attr.id} md={6}>
                    <Card className="border-primary">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center mb-2">
                          <Badge bg="primary" className="me-2">{index + 1}</Badge>
                          <h6 className="mb-0">{attr.displayName}</h6>
                        </div>
                        <p className="text-muted small mb-2">{description.description}</p>
                        <div className="d-flex justify-content-between">
                          <Badge bg={getImportanceColor(description.importance)}>
                            {description.importance}
                          </Badge>
                          <CheckCircleFill className="text-success" />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Alert variant="info">
              <InfoCircle className="me-2" />
              Belum ada atribut yang dipilih.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AttributeSelectionPage;
    