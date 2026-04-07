import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Vote, CheckCircle2, Loader2, Clock, ShieldCheck, Download, Users, FileText, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../context/ToastContext';
import html2canvas from 'html2canvas';

const candidateIcons = {
  'AI Innovation': '🤖',
  'Space Exploration': '🚀',
  'Quantum Computing': '⚛️',
  'Renewable Energy': '🌿'
};

const candidateManifestos = {
  'AI Innovation': {
    tagline: 'Advancing artificial intelligence and machine learning for the future of humanity.',
    vision: 'Our vision is to integrate ethical AI into every facet of public infrastructure, optimizing resource distribution and dramatically accelerating scientific discovery. We commit to transparency in algorithms and universal access to AI education.',
    goals: ['Establish National AI Research Hubs', 'Implement Algorithmic Fairness Laws', 'Universal Basic Compute Initiatives']
  },
  'Space Exploration': {
    tagline: 'Pushing the boundaries of space travel and interplanetary colonization.',
    vision: 'Humanity must become a multi-planetary species. We prioritize funding for sustainable orbital habitats, deep-space propulsion research, and the establishment of the first permanent lunar research base, ensuring our survival beyond Earth.',
    goals: ['Permanent Lunar Base by 2030', '10X Funding for Propulsion R&D', 'Orbital Debris Cleanup Programs']
  },
  'Quantum Computing': {
    tagline: "Harnessing quantum mechanics to solve the world's hardest computational problems.",
    vision: 'By reaching quantum supremacy in commercial sectors, we will revolutionize medicine, cryptography, and materials science. We aim to protect national data while cracking the mysteries of molecular biology to cure diseases at the atomic level.',
    goals: ['Quantum-Safe Cryptography Rollout', 'Subsidized Quantum Cloud Access', 'Atomic Medicine Grants']
  },
  'Renewable Energy': {
    tagline: 'Building sustainable clean energy infrastructure for a greener planet.',
    vision: 'A zero-emission future is non-negotiable. We will heavily subsidize next-generation nuclear fusion, advanced battery storage, and widespread deployment of smart grids to phase out fossil fuels entirely within the next decade.',
    goals: ['100% Renewable Grid by 2035', 'Fusion Energy Research Subsidies', 'Global Carbon Tax Enforcement']
  }
};

const Voting = ({ user }) => {
  const [candidates] = useState(['AI Innovation', 'Space Exploration', 'Quantum Computing', 'Renewable Energy']);
  const [selected, setSelected] = useState('');
  const [profileModal, setProfileModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);
  const [miningHash, setMiningHash] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [electionState, setElectionState] = useState({ isActive: true, endTime: null });
  const [timeLeft, setTimeLeft] = useState('');
  const [stats, setStats] = useState({ votesCast: 0 });
  
  const navigate = useNavigate();
  const { addToast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [{ data: eData }, { data: sData }] = await Promise.all([
        axios.get(`${API_URL}/api/election`),
        axios.get(`${API_URL}/api/stats`)
      ]);
      setElectionState(eData);
      setStats(sData);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh stats every 10s
    return () => clearInterval(interval);
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

  const downloadCertificate = async () => {
    addToast('Generating your certificate...', 'info');
    try {
      const element = document.getElementById('vote-certificate');
      const canvas = await html2canvas(element, { backgroundColor: '#0a0f1e', scale: 2 });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      const link = document.createElement('a');
      link.download = `votexchain_certificate_${receipt.blockIndex}.jpg`;
      link.href = dataUrl;
      link.click();
      addToast('Certificate downloaded!', 'success');
    } catch (err) {
      addToast('Failed to generate image', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="voting-container"
    >
      {/* Header & Metrics Dashboard */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
           <div className="glass-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Users size={20} color="var(--primary)" />
             <div style={{ textAlign: 'left' }}>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Network Voters</div>
               <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stats.votesCast}</div>
             </div>
           </div>
           {electionState.endTime && (
             <div className="glass-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderColor: timeLeft === 'Election Ended' ? 'var(--danger)' : 'rgba(251, 191, 36, 0.3)' }}>
               <Clock size={20} color={timeLeft === 'Election Ended' ? 'var(--danger)' : 'var(--warning)'} />
               <div style={{ textAlign: 'left' }}>
                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Remaining</div>
                 <div style={{ fontWeight: 700, fontSize: '1.1rem', color: timeLeft === 'Election Ended' ? 'var(--danger)' : 'var(--text-primary)' }}>
                   {timeLeft === 'Election Ended' ? 'Concluded' : timeLeft}
                 </div>
               </div>
             </div>
           )}
        </div>

        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', justifyContent: 'center' }}>Secure Voting Portal</h2>
        <p>Voter ID: <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{user?.voterId}</span></p>
      </div>

      {!voted ? (
        <>
          {/* Candidate Grid */}
          <div className="grid grid-2col" style={{ position: 'relative', maxWidth: '900px', margin: '0 auto' }}>
            {candidates.map((candidate, i) => (
              <motion.div 
                key={candidate}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`glass-card ${selected === candidate ? 'neon-active' : ''}`}
                onClick={() => setProfileModal(candidate)}
                style={{ cursor: 'pointer', border: selected === candidate ? '2px solid var(--primary)' : '1px solid var(--border-light)', textAlign: 'center', padding: '2rem 1.5rem', transition: 'transform 0.2s', filter: loading && selected !== candidate ? 'grayscale(0.8) opacity(0.4)' : 'none' }}
                whileHover={{ translateY: -5 }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{candidateIcons[candidate]}</div>
                <h3 style={{ marginBottom: '0.5rem', color: selected === candidate ? 'var(--primary)' : 'var(--text-primary)' }}>{candidate}</h3>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem', opacity: 0.8 }}>{candidateManifestos[candidate].tagline}</p>
                <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }} onClick={(e) => { e.stopPropagation(); setProfileModal(candidate); }}>View Manifesto & Vote</button>
                
                {selected === candidate && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={14} color="#0a0f1e" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            {loading && (
               <div style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--secondary-light)' }}>
                 Mining Block... <br/><span style={{opacity: 0.5}}>{miningHash}</span>
               </div>
            )}
            <motion.button 
              onClick={handleVote} 
              disabled={loading || !selected || !electionState.isActive || timeLeft === 'Election Ended'}
              className="btn btn-primary" 
              style={{ padding: '1rem 3rem', fontSize: '1.05rem', minWidth: '240px' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing & Encrypting...
                </span>
              ) : ('Confirm Vote')}
            </motion.button>
          </div>
        </>
      ) : (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Downloadable Certificate Entity */}
          <div id="vote-certificate" className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(0, 242, 255, 0.3)' }}>
             <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(0,242,255,0.05) 0%, transparent 70%)', zIndex: 0, animation: 'spin 20s linear infinite' }}></div>
             <div style={{ position: 'relative', zIndex: 1 }}>
               <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', borderRadius: '20px', border: '1px solid rgba(52, 211, 153, 0.4)', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                 <ShieldCheck size={18} /> Verified Voter
               </div>
               <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', letterSpacing: '1px' }}>Certificate of Participation</h1>
               <p style={{ opacity: 0.8, marginBottom: '2rem', fontSize: '0.9rem' }}>This cryptographic receipt proves your civic engagement on the immutable VotexChain ledger.</p>
               
               <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-deep)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '8px' }}>
                    <QRCodeSVG value={receipt ? `${window.location.origin}/verify` : ''} size={90} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Voted For</span>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1rem' }}>{selected}</div>
                    </div>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</span>
                        <div style={{ fontSize: '0.8rem' }}>{new Date(receipt?.timestamp).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Block Height</span>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>#{receipt?.blockIndex}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transaction Hash Signature</span>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary-light)', wordBreak: 'break-all', fontSize: '0.65rem' }}>{receipt?.hash}</div>
                    </div>
                  </div>
               </div>

               <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>VotexChain Decentralized Election Protocol v2.0</div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button onClick={downloadCertificate} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
              <Download size={18} /> Download NFT Certificate
            </button>
            <button onClick={() => navigate('/verify')} className="btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
               Verify Vote on Network
            </button>
          </div>
        </motion.div>
      )}

      {/* Candidate Profile Modal */}
      <AnimatePresence>
        {profileModal && (
          <div className="modal-overlay" onClick={() => setProfileModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ width: '90%', maxWidth: '600px', border: '1px solid var(--primary)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ fontSize: '2rem', background: 'rgba(0, 242, 255, 0.1)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {candidateIcons[profileModal]}
                   </div>
                   <h2 style={{ margin: 0 }}>{profileModal}</h2>
                 </div>
                 <button onClick={() => setProfileModal(null)} style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'}}><X size={24}/></button>
               </div>
               
               <div style={{ marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                   <FileText size={18} /> Official Manifesto
                 </div>
                 <p style={{ fontSize: '0.95rem', lineHeight: 1.6, opacity: 0.9, background: 'var(--bg-deep)', padding: '1rem', borderRadius: '8px' }}>
                   {candidateManifestos[profileModal].vision}
                 </p>
               </div>

               <div style={{ marginBottom: '2rem' }}>
                 <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Core Objectives</h4>
                 <ul style={{ listStyleType: 'none', padding: 0 }}>
                   {candidateManifestos[profileModal].goals.map((goal, idx) => (
                     <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                       <CheckCircle2 color="var(--success)" size={16} /> {goal}
                     </li>
                   ))}
                 </ul>
               </div>

               <div style={{ display: 'flex', gap: '1rem' }}>
                 <button 
                   onClick={() => { setSelected(profileModal); setProfileModal(null); }} 
                   className="btn btn-primary" style={{ flex: 1 }}
                 >
                   Select this Candidate
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 600px) { .grid-2col { grid-template-columns: 1fr; } }
      `}</style>
    </motion.div>
  );
};

export default Voting;
