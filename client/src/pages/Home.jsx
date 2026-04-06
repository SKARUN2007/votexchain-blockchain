import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Database, Cpu, BarChart3, Lock, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Database,
    color: 'var(--secondary-light)',
    title: 'Blockchain Integrity',
    desc: 'Every vote is stored as a block in a cryptographically linked chain using SHA-256 hashing.'
  },
  {
    icon: Lock,
    color: 'var(--primary)',
    title: 'Tamper-Proof Security',
    desc: 'Any unauthorized modification is instantly detected through hash verification across the network.'
  },
  {
    icon: BarChart3,
    color: 'var(--accent)',
    title: 'Real-Time Results',
    desc: 'Watch democratic results unfold live with animated consensus visualization and audit trails.'
  }
];

const stats = [
  { label: 'Encryption', value: 'SHA-256', icon: Lock },
  { label: 'Verification', value: 'Real-Time', icon: Zap },
  { label: 'Immutability', value: '100%', icon: ShieldCheck },
];

const Home = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="hero-section"
    >
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <motion.div 
          className="floating" 
          style={{ display: 'inline-block', marginBottom: '1.5rem' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div style={{ 
            width: 90, height: 90, 
            borderRadius: '50%', 
            background: 'rgba(0, 242, 255, 0.05)', 
            border: '2px solid rgba(0, 242, 255, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(0, 242, 255, 0.1)'
          }}>
            <ShieldCheck size={42} color="var(--primary)" strokeWidth={1.5} />
          </div>
        </motion.div>

        <h1>The Future of<br />Trusted Voting</h1>
        
        <p style={{ fontSize: '1.05rem', marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>
          Secure, transparent, and immutable voting powered by blockchain technology. 
          Experience a tamper-proof election system with real-time cryptographic verification.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/auth" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}>
            Get Started <ArrowRight size={16} />
          </Link>
          <Link to="/admin" className="btn btn-outline" style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}>
            Blockchain Explorer
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '3rem', 
          marginTop: '4rem', 
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 800, 
              color: 'var(--primary)', 
              letterSpacing: '-0.5px',
              fontFamily: 'var(--font-mono)'
            }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '0.3rem', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Features */}
      <div className="grid" style={{ marginTop: '3rem' }}>
        {features.map((feat, i) => (
          <motion.div 
            key={feat.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            className="glass-card"
            style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}
          >
            <div style={{
              width: 56, height: 56,
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${feat.color}15, ${feat.color}08)`,
              border: `1px solid ${feat.color}30`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <feat.icon size={26} color={feat.color} strokeWidth={1.5} />
            </div>
            <h3>{feat.title}</h3>
            <p style={{ fontSize: '0.85rem' }}>{feat.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Home;
