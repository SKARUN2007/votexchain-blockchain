const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  voterId: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Vote Schema
const VoteSchema = new mongoose.Schema({
  voterId: { type: String, required: true, unique: true },
  candidate: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Block Schema (Blockchain)
const BlockSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  timestamp: { type: String, required: true },
  data: { type: Object, required: true },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Vote: mongoose.model('Vote', VoteSchema),
  Block: mongoose.model('Block', BlockSchema)
};
