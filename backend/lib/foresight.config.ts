export default {
  enabled: true,
  depth: 5,
  anomalyThreshold: 0.72,
  channels: ["vision", "aura", "glyph", "whisper", "rift"],
  updateFrequency: 6000,
  fallbackMode: "passive", // "passive" | "reflective" | "disabled"
  oracleProfile: {
    precision: 0.88,
    fluctuationAllowance: 0.12,
    sensitivityCurve: [0.3, 0.5, 0.9],
  },
  outputFormat: "structured", // "structured" | "raw" | "encrypted"
  sigilInjection: true,
  allowExternalChannels: false,
}
