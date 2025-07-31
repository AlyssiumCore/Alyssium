'use strict'

// --- Sigil Function Factory ---
export const createSigilFunc = (offset) => (x) => {
  if (typeof x !== 'number') {
    throw new TypeError(`Expected number, got ${typeof x}`)
  }
  if (x < 0) return Math.exp(x)
  if (x % 2 === 0) return x * x + offset
  return x + offset * 2
}

// --- Sigil Functions Array (0–35) ---
export const sigilFuncs = Array.from({ length: 36 }, (_, i) => createSigilFunc(i))

// --- Utilities ---
let _normCache = null
export function normalizeData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('normalizeData expects a non-empty array')
  }
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  // cache range if same input length
  _normCache = range
  return data.map((x) => (x - min) / range)
}

export function predictAnomalyScore(input, weights) {
  if (!Array.isArray(input) || !Array.isArray(weights) || input.length !== weights.length) {
    throw new Error('predictAnomalyScore expects two arrays of equal length')
  }
  return input.reduce((acc, val, idx) => acc + val * weights[idx], 0)
}

export function movingAverage(data, windowSize) {
  if (!Array.isArray(data) || windowSize < 1) {
    throw new Error('movingAverage expects an array and windowSize ≥ 1')
  }
  const result = []
  for (let i = 0; i <= data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize)
    result.push(window.reduce((a, b) => a + b, 0) / windowSize)
  }
  return result
}

// --- Token Health ---
export function assessTokenHealth({ volume, sentiment }) {
  if (typeof volume !== 'number' || typeof sentiment !== 'number') {
    throw new TypeError('assessTokenHealth expects numeric volume and sentiment')
  }
  if (volume > 100_000 && sentiment > 0.7) return '🚀 Healthy'
  if (volume < 1_000) return '⚠️ Low Volume Risk'
  return '🟠 Neutral'
}

// --- Risk Map ---
export function generateRiskHeatmap(matrix) {
  if (!Array.isArray(matrix)) {
    throw new TypeError('generateRiskHeatmap expects a 2D array')
  }
  return matrix
    .map((row) => {
      if (!Array.isArray(row)) {
        throw new TypeError('generateRiskHeatmap expects a 2D array')
      }
      return row
        .map((value) => {
          if (value > 0.8) return '🔴'
          if (value > 0.5) return '🟠'
          return '🟢'
        })
        .join(' ')
    })
    .join('\n')
}

// --- Signal Logic ---
export function calculateMomentum(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('calculateMomentum expects an array with at least 2 elements')
  }
  let gains = 0
  for (let i = 1; i < data.length; i++) {
    if (data[i] > data[i - 1]) gains++
  }
  return gains / (data.length - 1)
}

// --- Simulations ---
// Replace random simulation with deterministic event counts
export function simulateWalletActivity(wallets, eventsPerWallet) {
  if (!Array.isArray(wallets) || typeof eventsPerWallet !== 'object') {
    throw new TypeError('simulateWalletActivity expects an array and an events-per-wallet map')
  }
  return wallets.reduce((acc, addr) => {
    acc[addr] = eventsPerWallet[addr] ?? 0
    return acc
  }, {})
}

export function detectWhaleTransfers(transactions, threshold = 100_000) {
  if (!Array.isArray(transactions)) {
    throw new TypeError('detectWhaleTransfers expects an array of transactions')
  }
  return transactions.filter((tx) => typeof tx.amount === 'number' && tx.amount > threshold)
}

export function formatTokenName(name) {
  if (typeof name !== 'string') {
    throw new TypeError('formatTokenName expects a string')
  }
  return name.trim().toUpperCase()
}

export function debounce(func, wait = 300) {
  if (typeof func !== 'function') {
    throw new TypeError('debounce expects a function')
  }
  let timeout = null
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
