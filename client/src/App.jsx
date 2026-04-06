import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Voting from './pages/Voting';
import Admin from './pages/Admin';
import HowItWorks from './pages/HowItWorks';
import ParticleBackground from './components/ParticleBackground';
import './App.css';

const Navigation = ({ user, handleLogout, theme, toggleTheme }) => (
  <nav>
    <Link to="/" className="nav-brand">
      VOTEX<span className="brand-accent">CHAIN</span>
      <span style={{ 
        fontSize: '0.5rem', padding: '2px 6px', background: 'rgba(0, 242, 255, 0.1)', 
        border: '1px solid rgba(0, 242, 255, 0.2)', borderRadius: '4px', 
        color: 'var(--primary)', letterSpacing: '1px', fontWeight: 600
      }}>v2.0</span>
    </Link>
    <div className="nav-links">
      <Link to="/how-it-works" style={{ fontSize: '0.85rem' }}>How It Works</Link>
      {user ? (
        <>
          <Link to="/voting">Vote</Link>
          <Link to="/admin">Dashboard</Link>
          <span className="nav-user-name">{user.name}</span>
          <button onClick={handleLogout} className="btn btn-outline" style={{ marginLeft: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Logout</button>
        </>
      ) : (
        <Link to="/auth" className="btn btn-primary" style={{ padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}>Login</Link>
      )}
      <button 
        onClick={toggleTheme} 
        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  </nav>
);

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <ToastProvider>
      <Router>
        <ParticleBackground />
        <div className="app-wrapper">
          <Navigation user={user} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
          <main className="app-container" style={{ paddingTop: '1rem', paddingBottom: '4rem' }}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/auth" element={<Auth setUser={setUser} />} />
                <Route path="/voting" element={<Voting user={user} />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
