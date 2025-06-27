interface AuraScanResult {
  signature: string
  dominantPattern: string
  anomalyLevel: number
  auraState: "stable" | "volatile" | "fractured" | "obscured" | "radiant"
  confidence: number
  timestamp: string
}

export function analyzeAura(tokenAddress: string): AuraScanResult {
  const clean = tokenAddress.trim()
  const signature = clean.slice(0, 6)
  const base = signature
    .split("")
    .reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0)

  const auraStates = ["stable", "volatile", "fractured", "obscured", "radiant"]
  const auraIndex = base % auraStates.length
  const anomaly = (base % 97) / 100
  const confidence = 0.6 + ((base % 37) / 100)

  return {
    signature,
    dominantPattern: `#${signature}`,
    anomalyLevel: parseFloat(anomaly.toFixed(2)),
    auraState: auraStates[auraIndex] as AuraScanResult["auraState"],
    confidence: parseFloat(confidence.toFixed(2)),
    timestamp: new Date().toISOString(),
  }
}
