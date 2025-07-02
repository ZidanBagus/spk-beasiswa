import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

// Impor semua ikon yang kita gunakan
import {
  HouseDoorFill,
  PeopleFill,
  ListCheck,
  UiChecksGrid,
  FileEarmarkBarGraphFill,
  BoxArrowRight,
  PersonCircle,
  Diagram2,
  CalculatorFill,
  ClockHistory // <-- Ikon baru untuk Riwayat Uji
} from 'react-bootstrap-icons';

const AppNavbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout: contextLogout } = useAuth();

  const handleLogout = () => {
    contextLogout();
    navigate('/login', { replace: true, state: { message: "Anda telah berhasil logout." } });
  };

  const usernameDisplay = currentUser ? currentUser.namaLengkap || currentUser.username : "Pengguna";

  return (
    <Navbar bg="light" variant="light" expand="lg" className="shadow-sm sticky-top py-2">
      <Container fluid className="px-3 px-lg-4">
        <Navbar.Brand 
          as={Link} 
          to={currentUser ? "/dashboard" : "/login"}
          className="fw-bolder text-primary fs-5 me-4"
          style={{ textDecoration: 'none' }}
        >
          SPK Beasiswa
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          {currentUser && (
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dashboard" className="fw-medium me-lg-1 d-flex align-items-center">
                <HouseDoorFill size={18} className="me-2" />Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/applicants" className="fw-medium me-lg-1 d-flex align-items-center">
                <PeopleFill size={18} className="me-2" />Pendaftar
              </Nav.Link>
              <Nav.Link as={Link} to="/attributes" className="fw-medium me-lg-1 d-flex align-items-center">
                <ListCheck size={18} className="me-2" />Atribut Seleksi
              </Nav.Link>
              <Nav.Link as={Link} to="/split-data" className="fw-medium me-lg-1 d-flex align-items-center">
                <Diagram2 size={18} className="me-2" />Pembagian Data
              </Nav.Link>
              <Nav.Link as={Link} to="/selection" className="fw-medium me-lg-1 d-flex align-items-center">
                <UiChecksGrid size={18} className="me-2" />Proses Seleksi
              </Nav.Link>
              <Nav.Link as={Link} to="/reports" className="fw-medium me-lg-1 d-flex align-items-center">
                <FileEarmarkBarGraphFill size={18} className="me-2" />Laporan
              </Nav.Link>
              {/* --- LINK BARU DITAMBAHKAN DI SINI --- */}
              <Nav.Link as={Link} to="/batch-history" className="fw-medium me-lg-1 d-flex align-items-center">
                <ClockHistory size={18} className="me-2" />Riwayat Uji
              </Nav.Link>
               <Nav.Link as={Link} to="/simulation" className="fw-medium me-lg-1 d-flex align-items-center">
                <CalculatorFill size={18} className="me-2" />Simulasi C4.5
              </Nav.Link>
            </Nav>
          )}
          <Nav className="ms-auto align-items-center">
            {currentUser ? (
              <NavDropdown
                title={
                  <>
                    <PersonCircle size={22} className="me-1 text-primary" /> 
                    <span className="fw-semibold">{usernameDisplay}</span>
                  </>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item onClick={handleLogout} className="text-danger fw-medium d-flex align-items-center">
                  <BoxArrowRight size={18} className="me-2"/> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : null }
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
