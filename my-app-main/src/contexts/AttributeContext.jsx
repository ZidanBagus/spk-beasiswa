// src/contexts/AttributeContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import attributeService from '../services/attributeService'; // Pastikan path ini benar

// 1. Buat Context
const AttributeContext = createContext(null);

// 2. Buat Provider Component
export const AttributeProvider = ({ children }) => {
  const [attributes, setAttributes] = useState([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(true);

  const fetchAttributes = useCallback(async () => {
    setIsLoadingAttributes(true);
    try {
      const data = await attributeService.getAllAttributes();
      // Handle both {attributes: []} and direct array response
      const attributesArray = data.attributes || data || [];
      setAttributes(attributesArray);
    } catch (error) {
      console.error("AttributeContext: Gagal memuat atribut", error);
      setAttributes([]); // Set ke array kosong jika gagal
    } finally {
      setIsLoadingAttributes(false);
    }
  }, []);

  // Ambil data saat provider pertama kali dimuat
  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // Nilai yang akan dibagikan ke seluruh komponen
  const value = {
    attributes,
    setAttributes, // Untuk memperbarui state dari komponen lain
    isLoadingAttributes,
    refetchAttributes: fetchAttributes // Fungsi untuk memuat ulang data
  };

  return (
    <AttributeContext.Provider value={value}>
      {children}
    </AttributeContext.Provider>
  );
};

// 3. Buat Custom Hook untuk mempermudah penggunaan context
export const useAttributes = () => {
  const context = useContext(AttributeContext);
  if (context === undefined) {
    throw new Error('useAttributes harus digunakan di dalam AttributeProvider');
  }
  return context;
};