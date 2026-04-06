import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { BookOpen, Hash, Link as LinkIcon, Database, CheckSquare } from 'lucide-react';

const HowItWorks = () => {
  const [demoInput, setDemoInput] = useState('Hello Blockchain');
  const [demoHash, setDemoHash] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchHash = async () => {
      try {
        const { data } = await axios.post(`${API_URL}/api/hash-demo`, { input: demoInput });
        setDemoHash(data.hash);
      } catch (err) {
        setDemoHash('Error calculating hash');
      }
    };
    const timeoutId = setTimeout(() => fetchHash(), 300); // debounce
    return () => clearTimeout(timeoutId);
  }, [demoInput, API_URL]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="how-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <BookOpen size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h1>How VotexChain Works</h1>
        <p style={{ color: 'var(--text-muted)' }}>Understanding the cryptographic principles securing your vote.</p>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
         <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
           <Hash size={24} color="var(--secondary-light)" /> 1. Cryptographic Hashing
         </h2>
         <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
           VotexChain uses <strong>SHA-256</strong> (Secure Hash Algorithm 256-bit). It takes an input of any size and produces a unique, fixed-size 64-character string. Changing even a single letter in the input completely changes the entire hash. This property is known as the <em>avalanche effect</em>.
         </p>
         
         <div style={{ background: 'var(--bg-deep)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
           <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Interactive Hash Demo</h4>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Try typing below to see how the hash changes instantly:</p>
           <input 
             type="text" 
             value={demoInput} 
             onChange={(e) => setDemoInput(e.target.value)}
             style={{ width: '100%', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
           />
           <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--primary)', wordBreak: 'break-all', padding: '1rem', background: 'rgba(0, 242, 255, 0.05)', border: '1px solid rgba(0, 242, 255, 0.2)', borderRadius: '4px' }}>
             {demoHash || 'Loading...'}
           </div>
         </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
         <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
           <Database size={24} color="var(--primary)" /> 2. Blocks & Data Payload
         </h2>
         <p style={{ lineHeight: 1.6 }}>
           When you cast a vote, its details (Voter ID, Candidate) are bundled into a <strong>Block</strong>. Alongside the vote data, the block includes a timestamp, an index number, and critically, the hash of the data itself.
         </p>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
         <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
           <LinkIcon size={24} color="var(--success)" /> 3. Chaining the Blocks
         </h2>
         <p style={{ lineHeight: 1.6 }}>
           This is where the "chain" in blockchain comes from. Every new block must include the <strong>hash of the previous block</strong>. If a malicious actor tries to alter a previous vote, that block's hash changes. Because the next block relies on the old hash, the link is broken, invalidating the entire chain from that point forward.
         </p>
      </div>

      <div className="glass-card">
         <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
           <CheckSquare size={24} color="var(--warning)" /> 4. Consensus & Merkle Trees
         </h2>
         <p style={{ lineHeight: 1.6 }}>
           While VotexChain is a simplified simulation for educational purposes, real blockchains use distributed networks to agree on the state of the chain (Consensus) and Merkle Trees to efficiently verify large numbers of transactions without needing to download the entire multi-gigabyte chain.
         </p>
      </div>
      
    </motion.div>
  );
};

export default HowItWorks;
