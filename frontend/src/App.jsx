import React from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard.jsx';
import ScanForm from './components/ScanForm.jsx';
import ReportForm from './components/ReportForm.jsx';
import MapView from './components/MapView.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import AccountsList from './components/AccountsList.jsx';

export default function App() {
  return (
    <div className="container">
      <header className="topbar">
        <h1>FakeAccount Detector</h1>
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/accounts">Database Accounts</NavLink>
          <NavLink to="/scan">Manual Scan</NavLink>
          <NavLink to="/reports">Report Accounts</NavLink>
          <NavLink to="/map">Geo Map</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<AccountsList />} />
          <Route path="/scan" element={<ScanForm />} />
          <Route path="/reports" element={<ReportForm />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<div>Not found. <Link to="/">Go home</Link></div>} />
        </Routes>
      </main>
      <footer className="footer">
        <button className="simulate" onClick={async () => {
          await fetch('/api/simulate/attack', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          alert('Simulated attack triggered. Refresh dashboard in a few seconds.');
        }}>Simulate Attack</button>
      </footer>
    </div>
  );
}




