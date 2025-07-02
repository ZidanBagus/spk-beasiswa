    import React, { useState } from 'react';
    import { Card, Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
    import { Save, CheckCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons';
    import { useAttributes } from '../contexts/AttributeContext';
    import { toast } from 'react-toastify';

    const AttributeSelectionPage = () => {
      const { attributes, setAttributes, isLoadingAttributes, refetchAttributes } = useAttributes();
      const [isSaving, setIsSaving] = useState(false);

      const selectedCount = attributes.filter(attr => attr.isSelected).length;
      const isSaveAllowed = selectedCount === 5;

      const handleToggle = (id) => {
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
          toast.success(response.message || 'Perubahan berhasil disimpan!');
          refetchAttributes();
        } catch (err) {
          toast.error(err.message || 'Gagal menyimpan perubahan.');
        } finally {
          setIsSaving(false);
        }
      };

      if (isLoadingAttributes && attributes.length === 0) {
        return <div className="text-center p-5"><Spinner /></div>;
      }

      return (
        <>
          <h1 className="h2 fw-bolder text-dark mb-4">Pengaturan Atribut Seleksi</h1>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light border-bottom-0 pt-3 pb-2 px-4">
              <h5 className="fw-medium mb-0">Pilih Atribut untuk Proses Seleksi</h5>
            </Card.Header>
            <Card.Body>
              <Alert variant={isSaveAllowed ? 'success' : 'warning'}>
                  {isSaveAllowed ? <CheckCircleFill className="me-2" /> : <ExclamationTriangleFill className="me-2" />}
                  Anda telah memilih <strong>{selectedCount}</strong> dari <strong>5</strong> atribut yang dibutuhkan.
              </Alert>

              <Form className="mt-4">
                  <Row xs={1} md={2} lg={3} className="g-3">
                    {attributes.map((attr) => (
                      <Col key={attr.id}>
                        <Form.Check
                          type="switch"
                          id={`attr-${attr.id}`}
                          label={attr.displayName}
                          checked={attr.isSelected}
                          onChange={() => handleToggle(attr.id)}
                          disabled={isSaving}
                          className="fw-medium"
                        />
                      </Col>
                    ))}
                  </Row>
              </Form>
            </Card.Body>
            <Card.Footer className="text-end bg-light border-top-0">
              <Button variant="primary" onClick={handleSave} disabled={isLoadingAttributes || isSaving || !isSaveAllowed}>
                {isSaving ? <Spinner as="span" size="sm" className="me-2" /> : <Save className="me-2" />}
                Simpan Perubahan
              </Button>
            </Card.Footer>
          </Card>
        </>
      );
    };

    export default AttributeSelectionPage;
    