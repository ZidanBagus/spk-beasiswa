import React, { useState, useEffect } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { Grid3x3Gap } from 'react-bootstrap-icons';
import { getCorrelationMatrix } from '../services/mockCorrelationAPI';

const CorrelationMatrix = ({ isLoading }) => {
    const [correlationData, setCorrelationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCorrelationData();
    }, []);

    const fetchCorrelationData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCorrelationMatrix();
            setCorrelationData(data);
        } catch (err) {
            console.error('Error fetching correlation data:', err);
            setError('Menggunakan data simulasi karena error: ' + err.message);
            // Fallback mock data (hanya 5 atribut input)
            setCorrelationData({
                attributes: ['IPK', 'Penghasilan', 'Tanggungan', 'Organisasi', 'UKM'],
                matrix: [
                    [1.00, -0.23, 0.15, 0.34, 0.28],
                    [-0.23, 1.00, 0.45, -0.12, -0.08],
                    [0.15, 0.45, 1.00, 0.09, 0.11],
                    [0.34, -0.12, 0.09, 1.00, 0.56],
                    [0.28, -0.08, 0.11, 0.56, 1.00]
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    const getCorrelationColor = (value) => {
        const absValue = Math.abs(value);
        if (absValue >= 0.7) return value > 0 ? '#0d5f2a' : '#8b0000'; // Strong correlation
        if (absValue >= 0.5) return value > 0 ? '#198754' : '#dc3545'; // Moderate correlation
        if (absValue >= 0.3) return value > 0 ? '#20c997' : '#fd7e14'; // Weak correlation
        return '#f8f9fa'; // No correlation
    };

    const getCorrelationStrength = (value) => {
        const absValue = Math.abs(value);
        if (absValue >= 0.7) return 'Kuat';
        if (absValue >= 0.5) return 'Sedang';
        if (absValue >= 0.3) return 'Lemah';
        return 'Tidak Ada';
    };

    const getCorrelationDirection = (value) => {
        if (Math.abs(value) < 0.1) return '';
        return value > 0 ? 'Positif' : 'Negatif';
    };

    const getAdminFriendlyExplanation = (insight) => {
        const { attr1, attr2, direction, correlation } = insight;
        
        // Penjelasan khusus berdasarkan kombinasi atribut
        if (attr1 === 'Organisasi' && attr2 === 'UKM') {
            return direction === 'positif' 
                ? 'Mahasiswa yang aktif organisasi cenderung juga aktif di UKM. Ini menunjukkan mahasiswa yang aktif berkegiatan.'
                : 'Mahasiswa yang aktif organisasi cenderung tidak aktif di UKM, mungkin karena fokus pada satu kegiatan.';
        }
        
        if (attr1 === 'Penghasilan' && attr2 === 'Tanggungan') {
            return direction === 'positif'
                ? 'Keluarga dengan tanggungan banyak cenderung berpenghasilan rendah. Ini sesuai dengan target beasiswa untuk keluarga kurang mampu.'
                : 'Keluarga dengan tanggungan banyak justru berpenghasilan tinggi, pola yang tidak biasa.';
        }
        
        if (attr1 === 'IPK' && attr2 === 'Penghasilan') {
            return direction === 'positif'
                ? 'Mahasiswa berpenghasilan tinggi cenderung memiliki IPK tinggi, mungkin karena akses pendidikan yang lebih baik.'
                : 'Mahasiswa berpenghasilan rendah justru memiliki IPK tinggi, menunjukkan motivasi belajar yang kuat meski keterbatasan ekonomi.';
        }
        
        if (attr1 === 'IPK' && (attr2 === 'Organisasi' || attr2 === 'UKM')) {
            return direction === 'positif'
                ? `Mahasiswa dengan IPK tinggi cenderung aktif ${attr2.toLowerCase()}. Ini menunjukkan kemampuan time management yang baik.`
                : `Mahasiswa dengan IPK tinggi cenderung tidak aktif ${attr2.toLowerCase()}, mungkin lebih fokus pada akademik.`;
        }
        
        // Penjelasan umum
        return direction === 'positif'
            ? `Ketika ${attr1} tinggi, ${attr2} juga cenderung tinggi. Kedua faktor ini saling mendukung.`
            : `Ketika ${attr1} tinggi, ${attr2} cenderung rendah. Kedua faktor ini berlawanan.`;
    };

    if (isLoading || loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <Grid3x3Gap className="me-2" />
                        Matriks Korelasi Atribut
                    </h6>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header className="bg-gradient-primary text-white">
                <h6 className="mb-0">
                    <Grid3x3Gap className="me-2" />
                    Matriks Korelasi Atribut
                </h6>
                <small>Analisis keterkaitan statistik antar variabel seleksi</small>
            </Card.Header>
            <Card.Body>
                {error && (
                    <div className="alert alert-warning">
                        <small>Menggunakan data simulasi. {error}</small>
                    </div>
                )}

                {correlationData && (
                    <>
                        {/* Admin Summary */}
                        <div className="mb-3 p-3 bg-primary bg-opacity-10 rounded border-start border-primary border-4">
                            <h6 className="text-primary mb-2">
                                📋 <strong>Ringkasan untuk Admin</strong>
                            </h6>
                            <div className="row text-center mb-2">
                                <div className="col-4">
                                    <div className="fw-bold text-success">{correlationData.matrix ? correlationData.matrix.length : 5}</div>
                                    <small className="text-muted">Atribut Dianalisis</small>
                                </div>
                                <div className="col-4">
                                    <div className="fw-bold text-warning">
                                        {correlationData.insights ? correlationData.insights.filter(i => Math.abs(i.correlation) >= 0.5).length : 1}
                                    </div>
                                    <small className="text-muted">Hubungan Kuat</small>
                                </div>
                                <div className="col-4">
                                    <div className="fw-bold text-info">
                                        {correlationData.insights ? correlationData.insights.filter(i => i.direction === 'positif').length : 1}
                                    </div>
                                    <small className="text-muted">Korelasi Positif</small>
                                </div>
                            </div>
                            <div className="alert alert-light mb-0">
                                <small>
                                    <strong>💡 Apa artinya?</strong><br/>
                                    • <strong>Hijau</strong> = Atribut saling mendukung (jika satu tinggi, yang lain juga tinggi)<br/>
                                    • <strong>Merah</strong> = Atribut berlawanan (jika satu tinggi, yang lain rendah)<br/>
                                    • <strong>Putih</strong> = Tidak ada hubungan khusus<br/>
                                    • <strong>Angka mendekati 1</strong> = Hubungan sangat kuat
                                </small>
                            </div>
                        </div>

                        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <Table size="sm" className="correlation-matrix-table">
                                <thead className="sticky-top bg-light">
                                    <tr>
                                        <th className="text-center" style={{ minWidth: '80px' }}>Atribut</th>
                                        {correlationData.attributes.map((attr, index) => (
                                            <th key={index} className="text-center" style={{ minWidth: '70px', fontSize: '0.8rem' }}>
                                                {attr}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {correlationData.attributes.map((rowAttr, rowIndex) => (
                                        <tr key={rowIndex}>
                                            <td className="fw-bold text-center bg-light" style={{ fontSize: '0.8rem' }}>
                                                {rowAttr}
                                            </td>
                                            {correlationData.matrix[rowIndex].map((value, colIndex) => (
                                                <td 
                                                    key={colIndex}
                                                    className="text-center p-1"
                                                    style={{
                                                        backgroundColor: getCorrelationColor(value),
                                                        color: Math.abs(value) >= 0.5 ? 'white' : 'black',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer'
                                                    }}
                                                    title={`${rowAttr} vs ${correlationData.attributes[colIndex]}: ${value.toFixed(3)} (${getCorrelationStrength(value)} ${getCorrelationDirection(value)})`}
                                                >
                                                    {value.toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        {/* Legend */}
                        <div className="mt-3">
                            <h6 className="mb-2">Legenda Korelasi:</h6>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                <Badge style={{ backgroundColor: '#0d5f2a' }}>Positif Kuat (≥0.7)</Badge>
                                <Badge style={{ backgroundColor: '#198754' }}>Positif Sedang (0.5-0.7)</Badge>
                                <Badge style={{ backgroundColor: '#20c997' }}>Positif Lemah (0.3-0.5)</Badge>
                                <Badge bg="light" text="dark">Tidak Ada (0.1-0.3)</Badge>
                                <Badge style={{ backgroundColor: '#fd7e14' }}>Negatif Lemah (-0.3 s/d -0.5)</Badge>
                                <Badge style={{ backgroundColor: '#dc3545' }}>Negatif Sedang (-0.5 s/d -0.7)</Badge>
                                <Badge style={{ backgroundColor: '#8b0000' }}>Negatif Kuat (≤-0.7)</Badge>
                            </div>
                        </div>

                        {/* Key Insights for Admin */}
                        {correlationData.insights && correlationData.insights.length > 0 && (
                            <div className="mt-3">
                                <h6 className="mb-2">🔍 Temuan Penting untuk Seleksi:</h6>
                                {correlationData.insights.slice(0, 2).map((insight, index) => (
                                    <div key={index} className="mb-2 p-3 border-start border-4 rounded" 
                                         style={{borderLeftColor: insight.direction === 'positif' ? '#198754' : '#dc3545', backgroundColor: insight.direction === 'positif' ? '#d1e7dd' : '#f8d7da'}}>
                                        <div className="d-flex align-items-center mb-1">
                                            <span className={`badge ${insight.direction === 'positif' ? 'bg-success' : 'bg-danger'} me-2`}>
                                                {insight.strength.toUpperCase()}
                                            </span>
                                            <strong>{insight.attr1} ↔ {insight.attr2}</strong>
                                        </div>
                                        <small className="text-dark">
                                            <strong>Artinya:</strong> {getAdminFriendlyExplanation(insight)}
                                        </small>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-3 p-3 bg-warning bg-opacity-10 rounded border border-warning">
                            <div className="d-flex align-items-start">
                                <span className="me-2">📝</span>
                                <div>
                                    <strong>Panduan untuk Admin:</strong><br/>
                                    <small className="text-muted">
                                        Matriks ini membantu memahami pola data pendaftar. Gunakan insight ini untuk:
                                        <br/>• Memvalidasi kriteria seleksi yang sudah ada
                                        <br/>• Mengidentifikasi pola unik dalam data pendaftar
                                        <br/>• Memastikan proses seleksi berjalan sesuai ekspektasi
                                    </small>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default CorrelationMatrix;