const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { User, Vote, Block } = require('./models');
const { Block: BlockClass, Blockchain, hashString } = require('./blockchain');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blockchain_voting';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123';

// Fallback storage if MongoDB is not available (useful for local development without DB)
const memoryDB = { users: [], votes: [], blocks: [] };

// --- In-Memory State for Extra Features ---
// Audit Log
const auditLog = [];
const addAuditLog = (action, details) => {
  auditLog.push({ action, details, timestamp: new Date().toISOString() });
};

// Election Timer
let electionState = {
  isActive: true,
  endTime: null, // e.g. new Date('2026-12-31').toISOString()
};

// Archives for past elections
let electionHistory = [];

// --- Database Connection & Setup ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    initializeBlockchain();
  })
  .catch(err => {
    console.warn('MongoDB connection error. Falling back to in-memory database.');
    initializeBlockchainInMem();
  });

async function initializeBlockchain() {
  const count = await Block.countDocuments();
  if (count === 0) {
    const genesisBlock = new BlockClass(0, new Date().toISOString(), "Genesis Block", "0");
    await new Block(genesisBlock).save();
    console.log('Genesis block created in MongoDB.');
  }
}

function initializeBlockchainInMem() {
  if (memoryDB.blocks.length === 0) {
    const genesisBlock = new BlockClass(0, new Date().toISOString(), "Genesis Block", "0");
    memoryDB.blocks.push(genesisBlock);
    console.log('Genesis block created in Memory.');
  }
}

// --- Middlewares ---
// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  message: { error: 'Too many authentication attempts, please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 general API requests
  message: { error: 'Too many requests, please slow down.' }
});

// JWT Protection Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// Election Guard
const isElectionActive = (req, res, next) => {
  if (!electionState.isActive) {
    return res.status(403).json({ error: 'Election is currently closed.' });
  }
  if (electionState.endTime && new Date() > new Date(electionState.endTime)) {
    electionState.isActive = false;
    return res.status(403).json({ error: 'Election has ended.' });
  }
  next();
};

app.use('/api/', apiLimiter);


// --- Routes ---

// Stats & Info
app.get('/api/stats', async (req, res) => {
  try {
    let registeredVoters = 0;
    let votesCast = 0;

    if (mongoose.connection.readyState === 1) {
      registeredVoters = await User.countDocuments();
      votesCast = await Vote.countDocuments();
    } else {
      registeredVoters = memoryDB.users.length;
      votesCast = memoryDB.votes.length;
    }

    const turnout = registeredVoters > 0 ? ((votesCast / registeredVoters) * 100).toFixed(2) : 0;
    res.json({ registeredVoters, votesCast, turnout: `${turnout}%` });
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Election Timer Config
app.get('/api/election', (req, res) => {
  res.json(electionState);
});

app.post('/api/election', (req, res) => {
  const { isActive, endTime } = req.body;
  if(isActive !== undefined) electionState.isActive = isActive;
  if(endTime !== undefined) electionState.endTime = endTime;
  addAuditLog(`ELECTION_STATE_UPDATED`, `Active: ${electionState.isActive}, EndTime: ${electionState.endTime}`);
  res.json({ message: 'Election state updated', state: electionState });
});

// Audit Log
app.get('/api/audit-log', (req, res) => {
  res.json(auditLog);
});

// Election History
app.get('/api/election/history', (req, res) => {
  res.json(electionHistory);
});

// Admin Reset
app.post('/api/reset', async (req, res) => {
  try {
    // Save current state to history
    let currentBlocks;
    let currentVotes;
    if (mongoose.connection.readyState === 1) {
      currentBlocks = await Block.find().sort({ index: 1 });
      currentVotes = await Vote.find();
      
      await Block.deleteMany({});
      await Vote.deleteMany({});
      
      const genesisBlock = new BlockClass(0, new Date().toISOString(), "Genesis Block", "0");
      await new Block(genesisBlock).save();
    } else {
      currentBlocks = [...memoryDB.blocks];
      currentVotes = [...memoryDB.votes];
      
      memoryDB.votes = [];
      memoryDB.blocks = [];
      const genesisBlock = new BlockClass(0, new Date().toISOString(), "Genesis Block", "0");
      memoryDB.blocks.push(genesisBlock);
    }
    
    electionHistory.push({
      date: new Date().toISOString(),
      blocks: currentBlocks,
      votes: currentVotes
    });

    addAuditLog(`ELECTION_RESET`, `Blockchain has been reset and archived`);
    res.json({ message: "Blockchain reset and previous election archived successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset blockchain" });
  }
});


// Educational Hash Demo
app.post('/api/hash-demo', (req, res) => {
  const { input } = req.body;
  if (!input && input !== "") return res.status(400).json({ error: 'No input provided' });
  const hash = hashString(input);
  res.json({ input, hash });
});


// Auth Routes
app.post('/api/register', authLimiter, async (req, res) => {
  const { name, voterId, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ voterId });
      if(existing) return res.status(400).json({ error: 'User already exists' });
      const newUser = new User({ name, voterId, password: hashedPassword });
      await newUser.save();
    } else {
      const existing = memoryDB.users.find(u => u.voterId === voterId);
      if(existing) return res.status(400).json({ error: 'User already exists' });
      memoryDB.users.push({ name, voterId, password: hashedPassword });
    }
    addAuditLog(`USER_REGISTERED`, `Voter ID: ${voterId}`);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: 'User registration failed' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  const { voterId, password } = req.body;
  try {
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ voterId });
    } else {
      user = memoryDB.users.find(u => u.voterId === voterId);
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id || voterId, voterId: user.voterId, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
    
    addAuditLog(`USER_LOGIN`, `Voter ID: ${voterId}`);
    res.json({ token, name: user.name, voterId: user.voterId });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Voting Route
app.post('/api/vote', authenticateToken, isElectionActive, async (req, res) => {
  const { candidate } = req.body;
  const voterId = req.user.voterId;

  try {
    // Check if duplicate vote
    let existingVote;
    if (mongoose.connection.readyState === 1) {
      existingVote = await Vote.findOne({ voterId });
    } else {
      existingVote = memoryDB.votes.find(v => v.voterId === voterId);
    }

    if (existingVote) return res.status(400).json({ error: 'User has already voted' });

    // Save vote to DB
    if (mongoose.connection.readyState === 1) {
      const vote = new Vote({ voterId, candidate });
      await vote.save();
    } else {
      memoryDB.votes.push({ voterId, candidate, timestamp: new Date() });
    }

    // Add to Blockchain
    let lastBlock;
    if (mongoose.connection.readyState === 1) {
      lastBlock = await Block.findOne().sort({ index: -1 });
    } else {
      lastBlock = memoryDB.blocks[memoryDB.blocks.length - 1];
    }

    const newBlockData = new BlockClass(
      lastBlock.index + 1,
      new Date().toISOString(),
      { voterId, candidate },
      lastBlock.hash
    );

    if (mongoose.connection.readyState === 1) {
      await new Block(newBlockData).save();
    } else {
      memoryDB.blocks.push(newBlockData);
    }

    addAuditLog(`VOTE_CAST`, `A generic vote was cast securely`);
    res.status(201).json({ 
      message: 'Vote recorded and added to blockchain',
      receipt: {
        hash: newBlockData.hash,
        blockIndex: newBlockData.index,
        timestamp: newBlockData.timestamp
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Voting failed', details: err.message });
  }
});

app.get('/api/blockchain', async (req, res) => {
  let chain;
  if (mongoose.connection.readyState === 1) {
    chain = await Block.find().sort({ index: 1 });
  } else {
    chain = memoryDB.blocks;
  }
  res.json(chain);
});

app.get('/api/results', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const results = await Vote.aggregate([
      { $group: { _id: '$candidate', count: { $sum: 1 } } }
    ]);
    res.json(results);
  } else {
    const results = memoryDB.votes.reduce((acc, vote) => {
      acc[vote.candidate] = (acc[vote.candidate] || 0) + 1;
      return acc;
    }, {});
    const formatted = Object.keys(results).map(key => ({ _id: key, count: results[key] }));
    res.json(formatted);
  }
});

app.get('/api/verify', async (req, res) => {
  let chain;
  if (mongoose.connection.readyState === 1) {
    chain = await Block.find().sort({ index: 1 });
  } else {
    chain = memoryDB.blocks;
  }
  const bc = new Blockchain();
  bc.chain = chain.map(b => new BlockClass(b.index, b.timestamp, b.data, b.previousHash));

  const result = bc.isChainValid();
  addAuditLog(`CHAIN_AUDITED`, `Result: ${result.valid ? 'Valid' : 'Tampering Detected'}`);
  res.json(result);
});

app.post('/api/tamper', authenticateToken, async (req, res) => {
  const { index, newData } = req.body;
  try {
    if (mongoose.connection.readyState === 1) {
      await Block.updateOne({ index }, { $set: { data: newData } });
    } else {
      const block = memoryDB.blocks.find(b => b.index === index);
      if (block) {
        block.data = newData;
      }
    }
    addAuditLog(`BLOCK_TAMPERED`, `Simulated tampering on Block #${index}`);
    res.json({ message: `Block #${index} data tampered with successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Tamper failed', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
