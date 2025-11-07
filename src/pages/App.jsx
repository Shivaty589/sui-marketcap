import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import TokenDetail from "./pages/TokenDetail";
import Admin from "./pages/Admin";

export default function App() {
  const [tokens, setTokens] = useState([]);

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">SuiMarketCap</Link>
        <nav>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/admin" className="nav-link">Add Token</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home tokens={tokens} setTokens={setTokens} />} />
        <Route path="/token/:symbol" element={<TokenDetail />} />
        <Route path="/admin" element={<Admin tokens={tokens} setTokens={setTokens} />} />
      </Routes>
    </div>
  );
}
