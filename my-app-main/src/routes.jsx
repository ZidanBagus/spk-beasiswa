// spkBeasiswa/my-app-main/src/routes.jsx

import React from 'react';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx'; // Old dashboard

const routes = [
  { path: '/', element: <LoginPage />, exact: true, isPrivate: false },
  { path: '/login', element: <LoginPage />, exact: true, isPrivate: false },
  { path: '/dashboard', element: <DashboardPage />, exact: true, isPrivate: true },
  { path: '/applicants', element: <ApplicantManagementPage />, exact: true, isPrivate: true },
  // { path: '/criteria', element: <CriteriaManagementPage />, exact: true, isPrivate: true }, // <-- Ganti baris ini
  { path: '/attributes', element: <AttributeSelectionPage />, exact: true, isPrivate: true }, // <-- Dengan baris ini
  { path: '/selection', element: <SelectionProcessPage />, exact: true, isPrivate: true },
  { path: '/reports', element: <ReportPage />, exact: true, isPrivate: true },
];

export default routes;