import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import TokenDetail from "./pages/TokenDetail";

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">SuiMarketCap</Link>
        <input className="search" type="text" placeholder="Search tokens..." />
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/token/:symbol" element={<TokenDetail />} />
      </Routes>
    </div>
  );
}
