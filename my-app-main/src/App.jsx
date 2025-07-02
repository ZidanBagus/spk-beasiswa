// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from './contexts/AuthContext.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';

// Impor semua komponen halaman yang akan digunakan
import DashboardPage from './pages/DashboardPage.jsx';
import ApplicantManagementPage from './pages/ApplicantManagementPage.jsx';
import AttributeSelectionPage from './pages/AttributeSelectionPage.jsx';
import DataSplittingPage from './pages/DataSplittingPage.jsx';
import SelectionProcessPage from './pages/SelectionProcessPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import SimulasiC45Page from './pages/SimulasiC45Page.jsx';
import BatchHistoryPage from './pages/BatchHistoryPage.jsx';
// <-- 1. Impor halaman baru

// --- 2. Daftarkan rute baru di sini ---
const privateAppRoutes = [
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/applicants", element: <ApplicantManagementPage /> },
  { path: "/attributes", element: <AttributeSelectionPage /> },
  { path: "/split-data", element: <DataSplittingPage /> },
  { path: "/selection", element: <SelectionProcessPage /> },
  { path: "/reports", element: <ReportPage /> },
  { path: "/simulation", element: <SimulasiC45Page /> }, 
    { path: "/batch-history", element: <BatchHistoryPage /> },// <-- Tambahkan rute ini
  { path: "/", element: <Navigate to="/dashboard" replace /> },
];
// ------------------------------------

const ProtectedRoute = () => {
  const { currentUser, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="info" style={{width: '3rem', height: '3rem'}} /> 
        <span className="ms-3 fs-5">Memeriksa Sesi...</span>
      </div>
    );
  }

  if (!currentUser) {
    const fromLocation = {
        pathname: location.pathname,
        search: location.search,
    };
    return <Navigate to="/login" replace state={{ from: fromLocation, message: "Anda harus login untuk mengakses halaman ini." }} />;
  }
  
  return <MainLayout><Outlet /></MainLayout>;
};

const PublicRoute = () => {
  const { currentUser, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="secondary" style={{width: '3rem', height: '3rem'}} />
        <span className="ms-3 fs-5">Memuat...</span>
      </div>
    );
  }
  return !currentUser ? <Outlet /> : <Navigate to="/dashboard" replace />;
};


function App() {
  const { isLoadingAuth } = useAuth(); 

  if (isLoadingAuth) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="grow" variant="primary" style={{width: '4rem', height: '4rem'}}/>
        <p className="mt-3 mb-0 fs-4 text-muted">Memuat Aplikasi SPK Beasiswa...</p>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          {privateAppRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
           <Route path="*" element={<Navigate to="/dashboard" replace />} /> 
        </Route>
        
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={3500} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
      />
    </>
  );
}

export default App;