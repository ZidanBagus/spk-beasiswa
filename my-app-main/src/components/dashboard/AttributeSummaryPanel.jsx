import React from 'react';
import { Card, Row, Col, Table } from 'react-bootstrap';

const AttributeSummaryPanel = ({ title, data, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="h-100 shadow-sm">
        <Card.Body>
          <div className="placeholder-glow">
            <div className="placeholder col-12 mb-3" style={{ height: '150px' }}></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!data || !data.labels || !data.datasets || data.labels.length === 0) {
    return (
      <Card className="h-100 shadow-sm">
        <Card.Body>
          <p className="text-center text-muted">Data tidak tersedia</p>
        </Card.Body>
      </Card>
    );
  }

  // Prepare table rows from data
  const rows = data.labels.map((label, idx) => {
    const diterima = data.datasets[0]?.data[idx] ?? 0;
    const tidakDiterima = data.datasets[1]?.data[idx] ?? 0;
    return (
      <tr key={label}>
        <td>{label}</td>
        <td>{diterima}</td>
        <td>{tidakDiterima}</td>
      </tr>
    );
  });

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header>
        <h6 className="mb-0">{title}</h6>
      </Card.Header>
      <Card.Body>
        <Table striped bordered hover size="sm" responsive>
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Diterima</th>
              <th>Tidak Diterima</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default AttributeSummaryPanel;
