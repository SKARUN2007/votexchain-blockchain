import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserPlus, KeyRound, IdCard, User } from 'lucide-react';

const Auth = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', voterId: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    try {
      const { data } = await axios.post(`${API_URL}${endpoint}`, formData);
      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ name: data.name, voterId: data.voterId }));
        setUser({ name: data.name, voterId: data.voterId });
        navigate('/voting');
      } else {
        setMessage('Registration successful! Please login.');
        setIsLogin(true);
        setFormData({ ...formData, name: '' });
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="auth-container"
    >
      <div className="glass-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: isLogin ? 'rgba(0, 242, 255, 0.05)' : 'rgba(124, 58, 237, 0.05)',
            border: isLogin ? '2px solid rgba(0, 242, 255, 0.15)' : '2px solid rgba(124, 58, 237, 0.15)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
            transition: 'all 0.3s ease'
          }}>
            {isLogin ? <UserCheck size={28} color="var(--primary)" strokeWidth={1.5} /> : <UserPlus size={28} color="var(--secondary-light)" strokeWidth={1.5} />}
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>{isLogin ? 'Voter Login' : 'Voter Registration'}</h2>
          <p style={{ fontSize: '0.85rem' }}>{isLogin ? 'Enter your credentials to access the portal' : 'Create your voter identity on the blockchain'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ position: 'relative' }}>
            <IdCard size={16} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Voter ID (e.g. V123)" 
              value={formData.voterId}
              onChange={(e) => setFormData({ ...formData, voterId: e.target.value })}
              required 
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <KeyRound size={16} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Secret Code" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required 
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ 
                  width: 16, height: 16, 
                  border: '2px solid transparent', 
                  borderTopColor: 'currentColor', 
                  borderRadius: '50%', 
                  animation: 'spin 0.6s linear infinite',
                  display: 'inline-block'
                }}></span>
                {isLogin ? 'Authenticating...' : 'Registering...'}
              </span>
            ) : (
              isLogin ? 'Enter Portal' : 'Register Voter'
            )}
          </button>
        </form>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ 
                color: message.includes('success') ? 'var(--success)' : 'var(--danger)', 
                textAlign: 'center', 
                fontSize: '0.85rem',
                marginTop: '1rem',
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: message.includes('success') ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 75, 43, 0.08)',
                border: message.includes('success') ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(255, 75, 43, 0.2)'
              }}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isLogin ? "New voter?" : "Already registered?"}{' '}
            <span 
              onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.target.style.opacity = '0.8'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              {isLogin ? 'Register Here' : 'Login Here'}
            </span>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

export default Auth;
