import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ValuationForm from './pages/ValuationForm';
import Templates from './pages/Templates';
import Entities from './pages/Entities';
import EntityTemplates from './pages/EntityTemplates';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import { AlertProvider } from './context/AlertContext';

import { useState, useEffect } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authStateChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, []);

  return (
    <Router>
      <AlertProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="entities" element={<Entities />} />
            <Route path="entities/:entityType" element={<EntityTemplates />} />
            <Route path="templates" element={<Templates />} />
            <Route path="reports" element={<Reports />} />
            <Route path="valuation/new/:templateId" element={<ValuationForm />} />
            <Route path="valuation/:id" element={<ValuationForm />} />
          </Route>
        </Routes>
      </AlertProvider>
    </Router>
  );
}

export default App;
