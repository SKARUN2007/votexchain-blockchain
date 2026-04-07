import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ShieldAlert, Database, Search, BarChart3, Clock, Hash, 
  AlertTriangle, RefreshCw, Download, RotateCcw, Activity, Eye, X, Lock
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import MerkleTree from '../components/MerkleTree';
import html2canvas from 'html2canvas';

const Admin = () => {
  const [chain, setChain] = useState([]);
  const [results, setResults] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [stats, setStats] = useState({ registeredVoters: 0, votesCast: 0, turnout: '0%' });
  const [history, setHistory] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [electionState, setElectionState] = useState({ isActive: true, endTime: null });
  const [pendingReset, setPendingReset] = useState({ proposedBy: null, signatures: [] });
  const [resultsLocked, setResultsLocked] = useState(false);
  
  // Modals
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [tamperModal, setTamperModal] = useState({ isOpen: false, block: null });

  const { addToast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [bcRes, logRes, statsRes, histRes, elRes, rstatRes] = await Promise.all([
        axios.get(`${API_URL}/api/blockchain`, { headers }),
        axios.get(`${API_URL}/api/audit-log`, { headers }),
        axios.get(`${API_URL}/api/stats`, { headers }),
        axios.get(`${API_URL}/api/election/history`, { headers }),
        axios.get(`${API_URL}/api/election`, { headers }),
        axios.get(`${API_URL}/api/reset-status`, { headers })
      ]);
      setChain(bcRes.data);
      setAuditLog(logRes.data.reverse());
      setStats(statsRes.data);
      setHistory(histRes.data);
      setElectionState(elRes.data);
      setPendingReset(rstatRes.data.pendingReset);

      try {
        const resRes = await axios.get(`${API_URL}/api/results`, { headers });
        setResults(bcRes.data.length > 0 ? resRes.data : []);
        setResultsLocked(false);
      } catch (err) {
        if(err.response?.status === 403) setResultsLocked(true);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const verifyChain = async () => {
    setVerification({ loading: true });
    try {
      const { data } = await axios.get(`${API_URL}/api/verify`);
      setTimeout(() => {
        setVerification(data);
        if (data.valid) {
          addToast('Blockchain verified successfully!', 'success');
        } else {
          addToast(`Tampering detected at block #${data.tamperedBlock}!`, 'error');
          // Automatically open hash comparison if tampered
          const block = chain.find(b => b.index === data.tamperedBlock);
          setTamperModal({ isOpen: true, block });
        }
      }, 1500);
    } catch (err) {
      setVerification({ valid: false, error: 'Verification failed' });
      addToast('Verification failed to execute.', 'error');
    }
  };

  const simulateTamper = async (index) => {
    if (!window.confirm(`⚠️ Tamper Block #${index}?\n\nThis will modify the block data without updating its hash, simulating a security breach.`)) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return addToast('You must be logged in.', 'error');

      await axios.post(`${API_URL}/api/tamper`, {
        index,
        newData: { voterId: 'TAMPERED_VOTER', candidate: 'MALICIOUS_ACTOR' }
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      fetchData();
      setVerification(null);
      addToast(`Block #${index} tampered! Run audit to detect.`, 'warning');
    } catch (err) {
      addToast('Tamper simulation failed', 'error');
    }
  };

  const resetElection = async () => {
    const isProposing = !pendingReset.proposedBy;
    if (!window.confirm(`⚠️ MULTI-SIG RESET\n\nResetting the blockchain requires 2 Admin signatures.\nAre you sure you want to ${isProposing ? 'propose' : 'sign'} a reset?`)) return;
    try {
      const { data } = await axios.post(`${API_URL}/api/reset`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
      setVerification(null);
      addToast(data.message, 'success');
    } catch (err) {
      addToast('Failed to process reset signature', 'error');
    }
  };

  const exportJPEG = async () => {
    addToast('Generating JPEG... Please wait.', 'info');
    try {
      const element = document.querySelector('.admin-container');
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0f1e', // match our dark theme
        scale: 2 // higher res
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      const link = document.createElement('a');
      link.download = `votexchain_dashboard_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      
      addToast('Dashboard downloaded as JPEG!', 'success');
    } catch (err) {
      addToast('Failed to generate image', 'error');
    }
  };

  const totalVotes = chain.length - 1; // Subtract genesis

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '8rem' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
          <RefreshCw size={36} color="var(--primary)" />
        </motion.div>
        <h2>Syncing with Blockchain Network...</h2>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="admin-container">
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }} data-html2canvas-ignore>
        <button onClick={exportJPEG} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
          <Download size={14} /> Download Dashboard (JPEG)
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <button onClick={resetElection} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> {pendingReset?.proposedBy ? (pendingReset.signatures.length >= 2 ? 'Executing...' : `Approve Reset (${pendingReset.signatures.length}/2)`) : 'Propose Reset'}
          </button>
          {pendingReset?.proposedBy && <span style={{ fontSize: '0.7rem', color: 'var(--warning)', letterSpacing: '0.5px' }}>Requires 2nd Admin Signature</span>}
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>Network Integrity Dashboard</h1>
        <p style={{ fontSize: '1rem' }}>Real-time cryptographic audit and blockchain explorer</p>
        
        {/* Stats Ribbon */}
        <div style={{ 
          display: 'inline-flex', gap: '2rem', marginTop: '1.5rem', padding: '0.75rem 1.5rem', 
          background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Blocks: <span style={{ color: 'var(--primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{chain.length}</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Turnout: <span style={{ color: 'var(--secondary-light)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.turnout}</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Status: <span style={{ color: 'var(--success)', fontWeight: 700 }}>● Live</span>
          </span>
        </div>
      </div>

      {/* Main Grid: 3 columns on large screens */}
      <div className="grid grid-3col">
        {/* Live Consensus & Turnout Ring */}
        <div className="glass-card" style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}><BarChart3 size={18} /> Consensus</h2>
            <span className="badge badge-verified" style={{ animation: 'glow-pulse 2s infinite' }}>Live</span>
          </div>

          {/* Turnout Donut Chart (CSS pure SVG implementation) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', position: 'relative' }}>
             <svg width="120" height="120" viewBox="0 0 120 120">
               <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-deep)" strokeWidth="12" />
               <motion.circle 
                 initial={{ strokeDasharray: "0, 314" }}
                 animate={{ strokeDasharray: `${(stats.votesCast/Math.max(stats.registeredVoters, 1))*314}, 314` }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 cx="60" cy="60" r="50" fill="none" stroke="var(--primary)" strokeWidth="12" 
                 strokeLinecap="round" transform="rotate(-90 60 60)" 
               />
             </svg>
             <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.turnout}</span>
               <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>VOTED</span>
             </div>
          </div>

          {resultsLocked ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.8, background: 'rgba(251, 191, 36, 0.05)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
               <Lock size={36} color="var(--warning)" style={{ marginBottom: '1rem' }} />
               <h3 style={{ color: 'var(--warning)', fontSize: '1rem', marginBottom: '0.25rem' }}>Contract Locked</h3>
               <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Results are cryptographically shielded until the election ends.</p>
            </div>
          ) : (
            <div>
              {results.length > 0 ? results.map((r, i) => {
                const percentage = totalVotes > 0 ? ((r.count / totalVotes) * 100).toFixed(1) : 0;
                return (
                  <div key={r._id} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r._id.split(' ')[0]}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--primary)' }}>{r.count}</span> ({percentage}%)
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.15 }}
                        style={{ height: '100%', background: `linear-gradient(90deg, var(--secondary), var(--primary))` }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>No votes yet</p>
              )}
            </div>
          )}
        </div>

        {/* Cryptographic Audit Card */}
        <div className="glass-card" style={{ gridColumn: 'span 1', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {verification?.loading && <div className="scanner"></div>}
          <h2 style={{ justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            <ShieldCheck size={18} /> Security Audit
          </h2>
          
          <div style={{ margin: '1.5rem 0' }}>
            <AnimatePresence mode="wait">
              {verification && !verification.loading ? (
                <motion.div 
                  key="result"
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ 
                    padding: '1.5rem', borderRadius: 'var(--radius-md)', 
                    background: verification.valid ? 'rgba(52, 211, 153, 0.05)' : 'rgba(255, 75, 43, 0.05)', 
                    color: verification.valid ? 'var(--success)' : 'var(--danger)', 
                    border: `1px solid ${verification.valid ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 75, 43, 0.2)'}`,
                  }}
                >
                  {verification.valid ? (
                    <>
                      <ShieldCheck size={44} style={{ marginBottom: '0.75rem' }} />
                      <h3 style={{ color: 'var(--success)', marginBottom: '0.25rem' }}>Healthy</h3>
                      <p style={{ opacity: 0.8, fontSize: '0.8rem' }}>Integrity confirmed.</p>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={44} style={{ marginBottom: '0.75rem' }} />
                      <h3 style={{ color: 'var(--danger)', marginBottom: '0.25rem' }}>Breach!</h3>
                      <p style={{ opacity: 0.8, fontSize: '0.8rem' }}>Block #{verification.tamperedBlock}</p>
                    </>
                  )}
                </motion.div>
              ) : verification?.loading ? (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '2rem 0' }}>
                  <Search size={36} color="var(--primary)" className="spin-slow" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>Scanning hashes...</p>
                </motion.div>
              ) : (
                <motion.div key="idle" style={{ padding: '1.5rem 0', opacity: 0.5 }}>
                  <Search size={36} style={{ marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>Run network scan</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={verifyChain} disabled={verification?.loading} className="btn btn-primary" style={{ width: '100%', fontSize: '0.9rem' }}>
            {verification?.loading ? 'Scanning...' : 'Execute Audit'}
          </button>
        </div>

        {/* Activity Feed */}
        <div className="glass-card" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column' }}>
           <h2 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} /> Network Log
           </h2>
           <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '0.5rem', scrollbarWidth: 'thin' }}>
              {auditLog.map((log, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  key={idx} style={{ 
                    padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{log.action}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{log.details}</div>
                </motion.div>
              ))}
              {auditLog.length === 0 && <p style={{textAlign: 'center', opacity: 0.5, marginTop: '2rem'}}>No activity</p>}
           </div>
        </div>
      </div>

      {/* Merkle Tree Section */}
      <div style={{ marginTop: '2rem' }}>
        <MerkleTree blocks={chain} />
      </div>

      {/* Blockchain Explorer */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>
            <Database size={20} color="var(--secondary-light)" /> Blockchain Explorer
          </h2>
        </div>
        
        <div className="block-chain-container">
          {chain.map((block, idx) => (
            <motion.div 
              key={block.index} 
              className="block-wrapper"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <div 
                className={`glass-card block-card ${(verification && !verification.valid && verification.tamperedBlock === block.index) ? 'tampered' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedBlock(block)}
              >
                {/* Block Header */}
                <div className="block-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Hash size={11} /> Block {block.index}
                  </span>
                  {block.index === 0 ? (
                    <span className="badge badge-verified">Genesis</span>
                  ) : (
                    <span className="badge badge-danger" onClick={(e) => { e.stopPropagation(); simulateTamper(block.index); }}>
                      <AlertTriangle size={8} style={{ marginRight: '3px' }} /> Tamper
                    </span>
                  )}
                </div>

                {/* Hashes (Truncated) */}
               <div className="hash-text">
                 <span style={{ color: 'var(--secondary-light)', fontWeight: 600, fontSize: '0.55rem' }}>NONCE </span>
                 <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{block.nonce || 0}</span>
               </div>
                <div className="hash-text hash-active">
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.55rem' }}>HASH </span>
                  {block.hash.substring(0, 16)}...
                </div>

                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                  <Clock size={9} /> {new Date(block.timestamp).toLocaleTimeString()}
                </div>
              </div>
              {idx < chain.length - 1 && <div className="block-connector"></div>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Block Detail Modal */}
      <AnimatePresence>
        {selectedBlock && (
          <div className="modal-overlay" onClick={() => setSelectedBlock(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ width: '90%', maxWidth: '600px', border: '1px solid var(--primary)' }} onClick={e => e.stopPropagation()}>
               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                 <h3>Block #{selectedBlock.index} Details</h3>
                 <button onClick={() => setSelectedBlock(null)} style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'}}><X/></button>
               </div>
               
               <div style={{ marginBottom: '1rem' }}>
                 <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem'}}>Timestamp</p>
                 <p>{new Date(selectedBlock.timestamp).toString()}</p>
               </div>

               <div style={{ marginBottom: '1rem' }}>
                 <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem'}}>Data Payload</p>
                 <pre style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--secondary-light)', overflowX: 'auto' }}>
                   {JSON.stringify(selectedBlock.data, null, 2)}
                 </pre>
               </div>

               <div style={{ marginBottom: '1rem' }}>
                 <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem'}}>PoW Nonce</p>
                 <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{selectedBlock.nonce || 0}</p>
               </div>

               <div>
                 <p style={{fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.2rem'}}>Current Block Hash</p>
                 <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--primary)', wordBreak: 'break-all' }}>{selectedBlock.hash}</p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tamper Comparison Modal */}
      <AnimatePresence>
        {tamperModal.isOpen && (
          <div className="modal-overlay" onClick={() => setTamperModal({ isOpen: false, block: null })} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 75, 43, 0.2)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="glass-card" style={{ width: '90%', maxWidth: '700px', border: '2px solid var(--danger)' }} onClick={e => e.stopPropagation()}>
               <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                 <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                 <h2 style={{ color: 'var(--danger)' }}>Cryptographic Mismatch Detected</h2>
                 <p>Block #{tamperModal.block?.index} data was altered post-mining.</p>
               </div>

               <div className="grid grid-2col" style={{ gap: '1rem' }}>
                 <div style={{ background: 'rgba(255, 75, 43, 0.1)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '4px' }}>
                   <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Calculated Hash (Based on altered data)</h4>
                   <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', wordBreak: 'break-all', opacity: 0.9 }}>
                     ⚠️ Hash re-computation fails to match the stored signature.
                   </p>
                 </div>
                 <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--success)', padding: '1rem', borderRadius: '4px' }}>
                   <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Stored Valid Hash</h4>
                   <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', wordBreak: 'break-all', opacity: 0.9 }}>
                     {tamperModal.block?.hash}
                   </p>
                 </div>
               </div>

               <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                 <button onClick={() => setTamperModal({ isOpen: false, block: null })} className="btn btn-outline">Close Diagnostics</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .spin-slow { animation: spin 3s linear infinite; }
        .grid-3col { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .grid-2col { display: grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) { .grid-2col { grid-template-columns: 1fr; } }
      `}</style>
    </motion.div>
  );
};

export default Admin;
