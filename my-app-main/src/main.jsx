// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'; // Komponen App utama Anda

// Impor CSS Bootstrap dan CSS React-Toastify SEBELUM CSS global Anda
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

import './index.css'; // CSS global kustom Anda

import { AuthProvider } from './contexts/AuthContext.jsx'; // Pastikan path ini benar
import { AttributeProvider } from './contexts/AttributeContext.jsx'; // Impor provider atribut yang baru

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* AuthProvider membungkus semua */}
        <AttributeProvider> {/* AttributeProvider membungkus App di dalam AuthProvider */}
          <App />
        </AttributeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);