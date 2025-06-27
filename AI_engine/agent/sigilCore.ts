type SigilInput = number;
type SigilOutput = number | string;

interface SigilMeta {
  label: string;
  weight: number;
  active: boolean;
}

interface TokenSignal {
  id: string;
  inputs: number[];
  output: SigilOutput;
  score: number;
}

const sigilWeights: number[] = Array.from({ length: 33 }, (_, i) => 1 + i * 0.1);

function normalize(input: number[], min = Math.min(...input), max = Math.max(...input)): number[] {
  return input.map(x => (x - min) / (max - min));
}

function weightedSum(inputs: number[], weights: number[]): number {
  return inputs.reduce((acc, val, i) => acc + val * weights[i], 0);
}

function evaluateSigil(input: SigilInput, offset = 0): SigilOutput {
  if (input < 0) return `Shadow: ${input}`;
  if (input % 2 === 0) return input * input + offset;
  return `Bright: ${input + offset}`;
}

function generateTokenSignal(id: string, rawInput: number[]): TokenSignal {
  const normalized = normalize(rawInput);
  const score = weightedSum(normalized, sigilWeights.slice(0, normalized.length));
  const sigilIndex = Math.floor(score % 33);
  const output = evaluateSigil(rawInput[sigilIndex] || 0, sigilIndex);
  return { id, inputs: rawInput, output, score };
}

function batchProcessSignals(tokenIds: string[], inputMatrix: number[][]): TokenSignal[] {
  return tokenIds.map((id, i) => generateTokenSignal(id, inputMatrix[i]));
}

function calculateMomentum(data: number[]): number {
  let gains = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i] > data[i - 1]) gains++;
  }
  return data.length > 1 ? gains / (data.length - 1) : 0;
}

export {
  SigilInput,
  SigilOutput,
  TokenSignal,
  SigilMeta,
  generateTokenSignal,
  batchProcessSignals,
  normalize,
  weightedSum,
  calculateMomentum,
};