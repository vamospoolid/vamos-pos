import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import TournamentDetail from './pages/TournamentDetail';
import Players from './pages/Players';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Bookings from './pages/Bookings';
import Announcements from './pages/Announcements';
import Settings from './pages/Settings';
import WhatsAppSettings from './pages/WhatsAppSettings';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes inside Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<TournamentDetail />} />
          <Route path="players" element={<Players />} />
          <Route path="reports" element={<Reports />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="settings" element={<Settings />} />
          <Route path="whatsapp-settings" element={<WhatsAppSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
