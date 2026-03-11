import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages placeholder
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ShareDownload from './pages/ShareDownload';
import LocalDiscovery from './pages/LocalDiscovery';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary-color)'}}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            FileShare Pro
          </div>
          <div>
            {isAuthenticated ? (
              <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <span style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>Hi, {user?.username}</span>
                <span style={{color: 'var(--border-color)'}}>|</span>
                <a href="/dashboard" style={{color: 'var(--text-color)'}}>Dashboard</a>
                <a href="/local" style={{color: 'var(--text-color)'}}>Local Send</a>
                <button onClick={logout} className="btn btn-outline" style={{padding: '0.25rem 0.75rem'}}>Logout</button>
              </div>
            ) : (
              <div style={{display: 'flex', gap: '1rem'}}>
                <a href="/login" className="btn btn-outline">Login</a>
                <a href="/register" className="btn btn-primary">Sign Up</a>
              </div>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/local" element={<LocalDiscovery />} />
            <Route path="/share/:token" element={<ShareDownload />} />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
