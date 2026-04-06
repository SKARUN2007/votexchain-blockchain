import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Vote, CheckCircle2, AlertCircle, Loader2, Clock, ShieldCheck, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../context/ToastContext';

const candidateIcons = {
  'AI Innovation': '🤖',
  'Space Exploration': '🚀',
  'Quantum Computing': '⚛️',
  'Renewable Energy': '🌿'
};

const candidateDescriptions = {
  'AI Innovation': 'Advancing artificial intelligence and machine learning for the future of humanity.',
  'Space Exploration': 'Pushing the boundaries of space travel and interplanetary colonization.',
  'Quantum Computing': "Harnessing quantum mechanics to solve the world's hardest computational problems.",
  'Renewable Energy': 'Building sustainable clean energy infrastructure for a greener planet.'
};

const Voting = ({ user }) => {
  const [candidates] = useState(['AI Innovation', 'Space Exploration', 'Quantum Computing', 'Renewable Energy']);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);
  const [miningHash, setMiningHash] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [electionState, setElectionState] = useState({ isActive: true, endTime: null });
  const [timeLeft, setTimeLeft] = useState('');
  
  const navigate = useNavigate();
  const { addToast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const fetchElectionState = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/election`);
      setElectionState(data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchElectionState();
  }, []);

  useEffect(() => {
    if(!electionState.endTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(electionState.endTime);
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft('Election Ended');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [electionState.endTime]);

  const handleVote = async () => {
    if (!selected) return addToast('Please select a candidate', 'warning');
    if (!electionState.isActive || timeLeft === 'Election Ended') {
      return addToast('The election is currently closed.', 'error');
    }

    setLoading(true);
    
    // Mining animation effect
    const miningInterval = setInterval(() => {
      setMiningHash(Array(64).fill(0).map(() => Math.random().toString(16)[2]).join(''));
    }, 50);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/api/vote`, {
        candidate: selected
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      clearInterval(miningInterval);
      setMiningHash(data.receipt.hash);
      setReceipt(data.receipt);
      setVoted(true);
      addToast('Vote recorded securely on the blockchain', 'success');
    } catch (err) {
      clearInterval(miningInterval);
      addToast(err.response?.data?.error || 'Voting failed', 'error');
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="voting-container"
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          background: 'rgba(0, 242, 255, 0.05)',
          border: '2px solid rgba(0, 242, 255, 0.15)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <Vote size={28} color="var(--primary)" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', justifyContent: 'center' }}>Cast Your Secure Vote</h2>
        <p>
          Voter ID: <span style={{ 
            color: 'var(--primary)', 
            fontFamily: 'var(--font-mono)', 
            fontWeight: 600,
            padding: '2px 8px',
            background: 'rgba(0, 242, 255, 0.05)',
            borderRadius: '4px',
            border: '1px solid rgba(0, 242, 255, 0.1)'
          }}>{user?.voterId}</span>
        </p>

        {electionState.endTime && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            marginTop: '1rem', padding: '0.5rem 1rem',
            background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 'var(--radius-full)', color: 'var(--warning)', fontWeight: 600
          }}>
            <Clock size={16} /> 
            {timeLeft === 'Election Ended' ? 'Election has concluded' : `Ends in: ${timeLeft}`}
          </div>
        )}
      </div>

      {!voted ? (
        <>
          {/* Candidate Cards */}
          <div className="grid" style={{ position: 'relative', maxWidth: '900px', margin: '0 auto' }}>
            {candidates.map((candidate, i) => (
              <motion.div 
                key={candidate}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`glass-card ${selected === candidate ? 'neon-active' : ''}`}
                onClick={() => !loading && setSelected(candidate)}
                style={{ 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  border: selected === candidate ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  boxShadow: selected === candidate ? '0 0 25px rgba(0, 242, 255, 0.12), inset 0 0 30px rgba(0, 242, 255, 0.03)' : 'var(--glass-shadow)',
                  background: selected === candidate ? 'rgba(0, 242, 255, 0.03)' : 'var(--glass-bg)',
                  filter: loading && selected !== candidate ? 'grayscale(0.8) opacity(0.4)' : 'none',
                  textAlign: 'center',
                  padding: '2rem 1.5rem'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{candidateIcons[candidate]}</div>
                <h3 style={{ 
                  marginBottom: '0.5rem', 
                  color: selected === candidate ? 'var(--primary)' : 'var(--text-primary)',
                  transition: 'color 0.3s'
                }}>{candidate}</h3>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>{candidateDescriptions[candidate]}</p>
                
                {selected === candidate && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ 
                      position: 'absolute', top: '0.75rem', right: '0.75rem',
                      width: 24, height: 24,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <CheckCircle2 size={14} color="#0a0f1e" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Submit */}
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            {loading && (
               <div style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--secondary-light)' }}>
                 Mining Block... <br/>
                 <span style={{opacity: 0.5}}>{miningHash}</span>
               </div>
            )}
            <motion.button 
              key="vote-btn"
              onClick={handleVote} 
              disabled={loading || !selected || !electionState.isActive || timeLeft === 'Election Ended'}
              className="btn btn-primary" 
              style={{ 
                padding: '1rem 3rem', 
                fontSize: '1.05rem',
                minWidth: '240px'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Encrypting...
                </span>
              ) : (
                'Confirm Vote'
              )}
            </motion.button>
          </div>
        </>
      ) : (
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="glass-card"
           style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}
        >
          <div style={{
            width: 70, height: 70, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
            border: '2px solid rgba(52, 211, 153, 0.4)'
          }}>
            <ShieldCheck size={36} color="var(--success)" />
          </div>
          <h2 style={{ color: 'var(--success)' }}>Vote Successfully Secured</h2>
          <p style={{ marginBottom: '2rem' }}>Your vote has been immutably recorded.</p>
          
          <div style={{
            background: 'var(--bg-deep)', padding: '1.5rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)', marginBottom: '2rem'
          }}>
             <div style={{ background: '#fff', padding: '1rem', display: 'inline-block', borderRadius: '8px', marginBottom: '1.5rem' }}>
               <QRCodeSVG value={receipt?.hash || ''} size={120} />
             </div>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'left' }}>
               <div style={{ marginBottom: '0.5rem' }}><strong>Block:</strong> #{receipt?.blockIndex}</div>
               <div style={{ marginBottom: '0.5rem' }}><strong>Time:</strong> {new Date(receipt?.timestamp).toLocaleString()}</div>
               <div><strong>Tx Hash:</strong> <br/><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', wordBreak: 'break-all', fontSize: '0.7rem' }}>{receipt?.hash}</span></div>
             </div>
          </div>

          <button onClick={() => navigate('/admin')} className="btn btn-outline" style={{width: '100%'}}>
            View Blockchain Dashboard
          </button>
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

export default Voting;
