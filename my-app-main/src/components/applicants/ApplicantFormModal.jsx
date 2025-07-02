import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';

const ApplicantFormModal = ({ show, onHide, onSubmit, applicantData }) => {
  const initialFormData = {
    nama: '',
    ipk: '',
    penghasilanOrtu: 'Rendah', // Default value
    jmlTanggungan: '',
    ikutOrganisasi: 'Tidak',
    ikutUKM: 'Tidak',
    prodi: '',
    jenisKelamin: 'L',
    jarakKampus: 'Dekat',
    asalSekolah: '',
    pekerjaanOrtu: '',
    // --- Field Baru Ditambahkan di Initial State ---
    tahunLulus: new Date().getFullYear() - 3, // Default tahun lulus 3 tahun lalu
    sks: '',
    statusBeasiswa: 'Ditolak', // Default value untuk data historis
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      if (applicantData) {
        setFormData({
          nama: applicantData.nama || '',
          ipk: applicantData.ipk || '',
          penghasilanOrtu: applicantData.penghasilanOrtu || 'Rendah',
          jmlTanggungan: applicantData.jmlTanggungan || '',
          ikutOrganisasi: applicantData.ikutOrganisasi || 'Tidak',
          ikutUKM: applicantData.ikutUKM || 'Tidak',
          prodi: applicantData.prodi || '',
          jenisKelamin: applicantData.jenisKelamin || 'L',
          jarakKampus: applicantData.jarakKampus || 'Dekat',
          asalSekolah: applicantData.asalSekolah || '',
          pekerjaanOrtu: applicantData.pekerjaanOrtu || '',
          // --- Inisialisasi State untuk Field Baru ---
          tahunLulus: applicantData.tahunLulus || '',
          sks: applicantData.sks || '',
          statusBeasiswa: applicantData.statusBeasiswa || 'Ditolak',
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [applicantData, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama || String(formData.nama).trim() === "") newErrors.nama = 'Nama lengkap wajib diisi.';
    
    const ipkNum = parseFloat(String(formData.ipk).replace(',', '.'));
    if (isNaN(ipkNum) || ipkNum < 0 || ipkNum > 4) newErrors.ipk = 'IPK harus berupa angka antara 0.00 dan 4.00.';

    if (!formData.penghasilanOrtu) newErrors.penghasilanOrtu = 'Kategori penghasilan wajib dipilih.';
    if (!formData.statusBeasiswa) newErrors.statusBeasiswa = 'Status beasiswa historis wajib diisi.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitInternal = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Pastikan data numerik dikirim sebagai angka
      const dataToSend = {
        ...formData,
        ipk: parseFloat(String(formData.ipk).replace(',', '.')),
        jmlTanggungan: parseInt(formData.jmlTanggungan) || 0,
        tahunLulus: parseInt(formData.tahunLulus) || null,
        sks: parseInt(formData.sks) || 0
      };
      onSubmit(dataToSend, applicantData ? applicantData.id : null);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">{applicantData ? 'Edit Data Pendaftar' : 'Tambah Data Pendaftar'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {Object.keys(errors).length > 0 && (
             <Alert variant="danger" className="py-2 small mb-3">Harap perbaiki isian yang ditandai error.</Alert>
        )}
        <Form id="applicantFormInternalInModal" onSubmit={handleSubmitInternal} noValidate>
          <Row className="g-3">
            <Col md={6}><Form.Group><Form.Label>Nama Lengkap <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="nama" value={formData.nama} onChange={handleChange} isInvalid={!!errors.nama} /><Form.Control.Feedback type="invalid">{errors.nama}</Form.Control.Feedback></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Program Studi</Form.Label><Form.Control type="text" name="prodi" value={formData.prodi} onChange={handleChange} placeholder="Contoh: Sistem Informasi"/></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Jenis Kelamin</Form.Label><Form.Select name="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange}><option value="L">Laki-laki</option><option value="P">Perempuan</option></Form.Select></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>IPK (0.00 - 4.00) <span className="text-danger">*</span></Form.Label><Form.Control type="number" step="0.01" name="ipk" value={formData.ipk} onChange={handleChange} isInvalid={!!errors.ipk} /><Form.Control.Feedback type="invalid">{errors.ipk}</Form.Control.Feedback></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Asal Sekolah</Form.Label><Form.Control type="text" name="asalSekolah" value={formData.asalSekolah} onChange={handleChange} placeholder="Contoh: SMAN 1 Tegal"/></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Tahun Lulus SMA/SMK</Form.Label><Form.Control type="number" name="tahunLulus" value={formData.tahunLulus} onChange={handleChange} placeholder="Contoh: 2022"/></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Jarak ke Kampus</Form.Label><Form.Select name="jarakKampus" value={formData.jarakKampus} onChange={handleChange}><option value="Dekat">Dekat</option><option value="Jauh">Jauh</option></Form.Select></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Jumlah SKS Ditempuh</Form.Label><Form.Control type="number" name="sks" value={formData.sks} onChange={handleChange} min="0" placeholder="Contoh: 48"/></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Pekerjaan Orang Tua</Form.Label><Form.Control type="text" name="pekerjaanOrtu" value={formData.pekerjaanOrtu} onChange={handleChange} placeholder="Contoh: Wiraswasta"/></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Penghasilan Orang Tua <span className="text-danger">*</span></Form.Label><Form.Select name="penghasilanOrtu" value={formData.penghasilanOrtu} onChange={handleChange} isInvalid={!!errors.penghasilanOrtu}><option value="Rendah">Rendah</option><option value="Sedang">Sedang</option><option value="Tinggi">Tinggi</option></Form.Select><Form.Control.Feedback type="invalid">{errors.penghasilanOrtu}</Form.Control.Feedback></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Jumlah Tanggungan</Form.Label><Form.Control type="number" name="jmlTanggungan" value={formData.jmlTanggungan} onChange={handleChange} min="0"/></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Ikut Organisasi Kampus?</Form.Label><Form.Select name="ikutOrganisasi" value={formData.ikutOrganisasi} onChange={handleChange}><option value="Tidak">Tidak</option><option value="Ya">Ya</option></Form.Select></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Ikut UKM?</Form.Label><Form.Select name="ikutUKM" value={formData.ikutUKM} onChange={handleChange}><option value="Tidak">Tidak</option><option value="Ya">Ya</option></Form.Select></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Status Beasiswa (Historis) <span className="text-danger">*</span></Form.Label><Form.Select name="statusBeasiswa" value={formData.statusBeasiswa} onChange={handleChange} isInvalid={!!errors.statusBeasiswa}><option value="Ditolak">Ditolak</option><option value="Diterima">Diterima</option></Form.Select><Form.Control.Feedback type="invalid">{errors.statusBeasiswa}</Form.Control.Feedback><Form.Text>Ini adalah "kunci jawaban" untuk melatih model.</Form.Text></Form.Group></Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Batal</Button>
        <Button variant="primary" type="submit" form="applicantFormInternalInModal">{applicantData ? 'Simpan Perubahan' : 'Simpan Pendaftar'}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ApplicantFormModal;