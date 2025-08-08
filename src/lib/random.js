const crypto = require('crypto');

function createSeededRng(seed) {
  let state = crypto.createHash('sha256').update(String(seed)).digest().readUInt32LE(0);
  return function rng() {
    // Xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    // Convert to [0,1)
    return ((state >>> 0) / 0xffffffff);
  };
}

function choice(rng, array) {
  return array[Math.floor(rng() * array.length)];
}

function intInRange(rng, min, maxInclusive) {
  return Math.floor(rng() * (maxInclusive - min + 1)) + min;
}

function floatInRange(rng, min, max) {
  return rng() * (max - min) + min;
}

function shuffle(rng, array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

module.exports = { createSeededRng, choice, intInRange, floatInRange, shuffle };


