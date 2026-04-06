import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle2 size={18} color="var(--success)" />,
  error: <AlertCircle size={18} color="var(--danger)" />,
  warning: <AlertCircle size={18} color="var(--warning)" />,
  info: <Info size={18} color="var(--primary)" />
};

const colors = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--primary)'
};

const Toast = ({ message, type = 'info', onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${colors[type]}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: `0 4px 20px ${colors[type]}20`,
        minWidth: '300px',
        maxWidth: '400px'
      }}
    >
      <div style={{ flexShrink: 0 }}>
        {icons[type]}
      </div>
      <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        {message}
      </div>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;
