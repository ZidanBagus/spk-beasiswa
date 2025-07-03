// spkBeasiswa/my-app-main/src/routes.jsx

import React from 'react';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage.jsx';
import ApplicantManagementPage from './pages/ApplicantManagementPage.jsx';
import AttributeSelectionPage from './pages/AttributeSelectionPage.jsx';
import SelectionProcessPage from './pages/SelectionProcessPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import DataSplittingPage from './pages/DataSplittingPage.jsx';
import SimulasiC45Page from './pages/SimulasiC45Page.jsx';

const routes = [
  { path: '/', element: <LoginPage />, exact: true, isPrivate: false },
  { path: '/login', element: <LoginPage />, exact: true, isPrivate: false },
  { path: '/dashboard', element: <AnalyticsDashboardPage />, exact: true, isPrivate: true },
  { path: '/dashboard-old', element: <DashboardPage />, exact: true, isPrivate: true },
  { path: '/applicants', element: <ApplicantManagementPage />, exact: true, isPrivate: true },
  { path: '/attributes', element: <AttributeSelectionPage />, exact: true, isPrivate: true },
  { path: '/split-data', element: <DataSplittingPage />, exact: true, isPrivate: true },
  { path: '/selection', element: <SelectionProcessPage />, exact: true, isPrivate: true },
  { path: '/simulation', element: <SimulasiC45Page />, exact: true, isPrivate: true },
  { path: '/reports', element: <ReportPage />, exact: true, isPrivate: true },
];

export default routes;
