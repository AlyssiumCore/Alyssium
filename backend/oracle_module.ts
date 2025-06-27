
interface TokenInsight {
  volume24h: number
  liquidityRatio: number
  sentimentScore: number
  flaggedContracts: number
}

interface RiskAssessmentResult extends TokenInsight {
  riskLevel: string
  score: number
  timestamp: string
}

const WEIGHTS = {
  volume: 0.25,
  liquidity: 0.35,
  sentiment: 0.25,
  penalties: 20
}

export function assessTokenRisk(insight: TokenInsight): RiskAssessmentResult {
  const { volume24h, liquidityRatio, sentimentScore, flaggedContracts } = insight


  const volumeNorm = Math.min(volume24h / 1e6, 1)
  const liquidityNorm = Math.min(liquidityRatio / 10, 1)
  const sentimentNorm = Math.min(sentimentScore, 1)

  const rawScore = (
    volumeNorm * WEIGHTS.volume +
    liquidityNorm * WEIGHTS.liquidity +
    sentimentNorm * WEIGHTS.sentiment
  ) * 100 - (flaggedContracts * WEIGHTS.penalties)

  const score = Math.max(0, Math.min(100, rawScore))

  let riskLevel = "High Risk"
  if (score >= 75) riskLevel = "Low Risk"
  else if (score >= 45) riskLevel = "Moderate Risk"

  return {
    ...insight,
    riskLevel,
    score: Math.round(score),
    timestamp: new Date().toISOString()
  }
}

export function enrichTokenData(data: TokenInsight): Record<string, string | number> {
  const assessment = assessTokenRisk(data)
  return {
    volume24h: assessment.volume24h,
    liquidityRatio: assessment.liquidityRatio,
    sentimentScore: assessment.sentimentScore,
    flaggedContracts: assessment.flaggedContracts,
    risk: assessment.riskLevel,
    score: assessment.score,
    timestamp: assessment.timestamp
  }
}
