import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ApplicationsList from './pages/ApplicationsList';
import ApplicationDetail from './pages/ApplicationDetail';
import SubmitApplication from './pages/SubmitApplication';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            {/* Shared Routes (Admin & Officer) */}
            <Route element={<ProtectedRoute allowedRoles={['Officer', 'Admin']} />}>
              <Route path="/" element={<ApplicationsList />} />
              <Route path="/applications/:id" element={<ApplicationDetail />} />
            </Route>

            {/* Officer Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Officer']} />}>
              <Route path="/submit" element={<SubmitApplication />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;