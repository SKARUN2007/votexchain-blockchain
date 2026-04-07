const CryptoJS = require('crypto-js');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data; // UserID, Candidate, VoteID
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return CryptoJS.SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.data) +
      this.nonce
    ).toString();
  }

  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block Mined: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3; // Target: hash must start with 3 zeros
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), "Genesis Block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check current hash
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return { valid: false, tamperedBlock: currentBlock.index };
      }

      // Check if hash meets difficulty criteria
      if (currentBlock.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
        return { valid: false, tamperedBlock: currentBlock.index };
      }

      // Check link to previous hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        return { valid: false, tamperedBlock: currentBlock.index };
      }
    }
    return { valid: true };
  }

  static calculateMerkleRoot(blocks) {
    if (!blocks || blocks.length === 0) return '';
    let hashes = blocks.map(b => b.hash);
    while (hashes.length > 1) {
      if (hashes.length % 2 !== 0) {
        hashes.push(hashes[hashes.length - 1]);
      }
      const nextLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        nextLevel.push(CryptoJS.SHA256(hashes[i] + hashes[i + 1]).toString());
      }
      hashes = nextLevel;
    }
    return hashes[0];
  }
}

function hashString(input) {
  return CryptoJS.SHA256(input).toString();
}

module.exports = { Block, Blockchain, hashString };
