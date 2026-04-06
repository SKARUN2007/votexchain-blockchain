const CryptoJS = require('crypto-js');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data; // UserID, Candidate, VoteID
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return CryptoJS.SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.data)
    ).toString();
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
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
