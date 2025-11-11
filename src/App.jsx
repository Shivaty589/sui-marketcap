import React, { useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import TokenDetail from "./pages/TokenDetail";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        navigate('/admin');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">SuiMarketCap</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0.1 }}>
            <Link
              to="/admin"
              style={{
                color: '#38bdf8',
                textDecoration: 'none',
                fontSize: '10px'
              }}
            >
              Admin
            </Link>
          </div>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/token/:symbol" element={<TokenDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}
