import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, ShieldAlert, Hash, Clock, Server } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Verify = () => {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const { addToast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!hash.trim()) return addToast('Please enter a transaction hash', 'warning');

    setLoading(true);
    setResult(null);

    // Artificial delay for scanning animation
    setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/verify-receipt/${hash.trim()}`);
        setResult(data);
        if(data.valid) {
          addToast('Vote securely located on the blockchain!', 'success');
        }
      } catch (err) {
        if(err.response?.status === 404) {
          setResult({ valid: false, message: 'Transaction hash not found.' });
          addToast('Hash not found on the network.', 'error');
        } else {
          addToast('Verification failed.', 'error');
        }
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="verify-container"
      style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 1.5rem',
          borderRadius: '50%', background: 'rgba(52, 211, 153, 0.1)',
          border: '2px solid rgba(52, 211, 153, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ShieldCheck size={32} color="var(--success)" />
        </div>
        <h1 style={{ marginBottom: '0.5rem' }}>Verify Your Vote</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Enter your cryptographic receipt ID to prove your vote was permanently recorded. 
          <br/>Your candidate choice remains completely anonymous.
        </p>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Hash size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Paste your 64-character Transaction Hash" 
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '3rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? <Search className="spin" size={18} /> : <Search size={18} />}
            {loading ? 'Scanning...' : 'Verify'}
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ textAlign: 'center', padding: '3rem 0' }}
          >
             <div className="scanner-line" style={{ width: '100%', height: '2px', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)', marginBottom: '2rem', animation: 'scan 1.5s infinite alternate' }}></div>
             <Server size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
             <h3 style={{ color: 'var(--primary)' }}>Querying Network Nodes...</h3>
             <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7 }}>searching ledger for hash signature</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`glass-card ${result.valid ? 'success-pulse' : 'danger-pulse'}`}
            style={{ 
              border: result.valid ? '2px solid rgba(52, 211, 153, 0.4)' : '2px solid rgba(255, 75, 43, 0.4)',
              background: result.valid ? 'rgba(52, 211, 153, 0.05)' : 'rgba(255, 75, 43, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
              <div style={{ marginTop: '0.25rem' }}>
                {result.valid ? <ShieldCheck size={48} color="var(--success)" /> : <ShieldAlert size={48} color="var(--danger)" />}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: result.valid ? 'var(--success)' : 'var(--danger)', marginBottom: '0.5rem' }}>
                  {result.valid ? 'Transaction Verified' : 'Transaction Not Found'}
                </h2>
                
                {result.valid ? (
                  <>
                    <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
                      Mathematical proof confirms this transaction exists immutably on the VotexChain ledger.
                    </p>
                    <div style={{ display: 'grid', gap: '1rem', background: 'var(--bg-deep)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hash Signature</span>
                        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', wordBreak: 'break-all', fontSize: '0.9rem', marginTop: '0.25rem' }}>{hash}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '2rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}><Hash size={12} style={{display: 'inline', marginRight: 4}}/>Block Height</span>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '0.25rem' }}>{result.blockIndex}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}><Clock size={12} style={{display: 'inline', marginRight: 4}}/>Timestamp</span>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '0.25rem' }}>{new Date(result.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ opacity: 0.9 }}>
                    {result.message || 'We could not locate this hash on the blockchain. Ensure you copied it correctly.'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes scan { 0% { transform: translateX(-50%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(50%); opacity: 0; } }
        @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.5; transform: scale(0.95); } }
        .success-pulse { animation: successPulse 2s infinite; }
        .danger-pulse { animation: dangerPulse 2s infinite; }
        @keyframes successPulse { 0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); } 100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); } }
        @keyframes dangerPulse { 0% { box-shadow: 0 0 0 0 rgba(255, 75, 43, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 75, 43, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 75, 43, 0); } }
      `}</style>
    </motion.div>
  );
};

export default Verify;
