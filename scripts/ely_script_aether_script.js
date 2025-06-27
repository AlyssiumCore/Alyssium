'use strict';

// --- Sigil Function Factory ---
function createSigilFunc(offset) {
    return function(x) {
        if (x < 0) return Math.exp(x);
        else if (x % 2 === 0) return x * x + offset;
        else return x + offset * 2;
    };
}

// --- Sigil Functions Array (0-35) ---
const sigilFuncs = Array.from({ length: 36 }, (_, i) => createSigilFunc(i));

// --- Utilities ---
function normalizeData(data) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    return data.map(x => (x - min) / (max - min));
}

function predictAnomalyScore(input, weights) {
    return input.reduce((acc, val, idx) => acc + val * weights[idx], 0);
}

function movingAverage(data, windowSize) {
    let result = [];
    for (let i = 0; i < data.length - windowSize + 1; i++) {
        let window = data.slice(i, i + windowSize);
        result.push(window.reduce((a, b) => a + b) / windowSize);
    }
    return result;
}

// --- Token Health ---
function assessTokenHealth(data) {
    if (data.volume > 100000 && data.sentiment > 0.7) return "🚀 Healthy";
    else if (data.volume < 1000) return "⚠️ Low Volume Risk";
    else return "🟠 Neutral";
}

// --- Risk Map ---
function generateRiskHeatmap(matrix) {
    return matrix.map(row =>
        row.map(value => value > 0.8 ? "🔴" : value > 0.5 ? "🟠" : "🟢").join(" ")
    ).join("\n");
}

// --- Signal Logic ---
function calculateMomentum(data) {
    let gains = 0;
    for (let i = 1; i < data.length; i++) {
        if (data[i] > data[i - 1]) gains++;
    }
    return gains / (data.length - 1);
}

// --- Simulations ---
function simulateWalletActivity(wallets, events) {
    const sim = {};
    wallets.forEach(addr => {
        sim[addr] = Math.floor(Math.random() * events);
    });
    return sim;
}

function detectWhaleTransfers(transactions) {
    return transactions.filter(tx => tx.amount > 100000);
}

function formatTokenName(name) {
    return name.trim().toUpperCase();
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
