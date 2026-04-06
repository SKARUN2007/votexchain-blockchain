import React from 'react';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';

const MerkleTree = ({ blocks }) => {
  // A simplified Merkle Tree visualizer using nested flexboxes
  // Only shows top 3 levels for presentation, avoiding infinite nesting on large chains

  if (!blocks || blocks.length === 0) return null;

  const validBlocks = blocks.filter(b => b.index > 0); // Ignore genesis for tree leaves
  if (validBlocks.length === 0) return <div style={{textAlign: 'center', opacity: 0.5}}>No transactions yet</div>;

  const leaves = validBlocks.map(b => b.hash.substring(0, 8));
  
  // Calculate level 1 (parents of leaves)
  const l1 = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const right = i + 1 < leaves.length ? leaves[i + 1] : leaves[i];
    l1.push(`${leaves[i].substring(0, 4)}...${right.substring(0, 4)}`);
  }

  // Calculate root (top of this simplified tree representation)
  const rootObj = l1.length > 0 ? `${l1[0].substring(0, 4)}...ROOT` : 'ROOT';

  return (
    <div style={{ padding: '1rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Network size={16} /> Merkle Tree Structure
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', minWidth: 'max-content' }}>
        {/* Root */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="merkle-node root">
          {rootObj}
        </motion.div>

        {/* Connections (Visual only) */}
        {l1.length > 0 && <div className="merkle-connector-v"></div>}
        
        {/* Level 1 */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          {l1.map((hash, i) => (
            <motion.div key={hash+i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="merkle-node branch">
              {hash}
            </motion.div>
          ))}
        </div>

        {/* Leaves */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {leaves.map((hash, i) => (
            <motion.div key={hash+i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (0.05 * i) }} className="merkle-node leaf" title={validBlocks[i].hash}>
              Tx: {hash}
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        .merkle-node {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          border: 1px solid var(--primary);
          background: rgba(0, 242, 255, 0.05);
          color: var(--primary);
          box-shadow: 0 0 10px rgba(0, 242, 255, 0.1);
        }
        .root { border-color: var(--secondary-light); color: var(--secondary-light); background: rgba(124, 58, 237, 0.1); }
        .branch { border-color: var(--text-muted); color: var(--text-primary); }
        .merkle-connector-v { width: 1px; height: 1.5rem; background: var(--border-subtle); margin-top: -1.5rem; margin-bottom: -1.5rem; }
      `}</style>
    </div>
  );
};

export default MerkleTree;
