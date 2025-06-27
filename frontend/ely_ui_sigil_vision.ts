// Types
export type SigilResult = number | string

// Function to calculate a sigil value based on input strength
export function calculateSigilStrength(input: number): SigilResult {
  if (input < 0) 
    return `Shadow Essence: ${input}`
  else if (input % 2 === 0) 
    return input * input
  else 
    return `Bright Essence: ${input}`
}

// Interface for UI options
export interface SigilUIOptions {
  containerId: string
  width?: number
  height?: number
  backgroundColor?: string
}

// Initializes the vision canvas for sigils
export function initializeSigilVision(options: SigilUIOptions): HTMLCanvasElement {
  const container = document.getElementById(options.containerId)
  if (!container) 
    throw new Error(`Container with id ${options.containerId} not found`)

  const canvas = document.createElement('canvas')
  canvas.width = options.width ?? 400
  canvas.height = options.height ?? 300
  canvas.style.background = options.backgroundColor ?? '#0e0e1f'

  container.appendChild(canvas)
  return canvas
}

// Draws a basic sigil pattern based on strength
export function drawSigil(canvas: HTMLCanvasElement, strength: number): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(centerX, centerY) * (Math.min(strength, 10) / 10)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#80d8ff'
  ctx.lineWidth = 2 + (strength % 5)

  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i
    ctx.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    )
  }
  ctx.closePath()
  ctx.stroke()
}

// Updates the displayed sigil value and redraws pattern
export function updateSigilDisplay(
  input: number,
  canvas: HTMLCanvasElement,
  displayElement: HTMLElement
): void {
  const result = calculateSigilStrength(input)
  displayElement.textContent = String(result)
  const strength = typeof result === 'number' ? result : input
  drawSigil(canvas, Number(strength))
}

// Registers input events to update vision in real-time
export function registerSigilInput(
  inputElement: HTMLInputElement,
  canvas: HTMLCanvasElement,
  displayElement: HTMLElement
): void {
  inputElement.addEventListener('input', () => {
    const value = parseInt(inputElement.value, 10) || 0
    updateSigilDisplay(value, canvas, displayElement)
  })
}

// Example initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const canvas = initializeSigilVision({ 
    containerId: 'sigil-vision',
    width: 500,
    height: 400,
    backgroundColor: '#111122'
  })
  const display = document.getElementById('sigil-result')!
  const input = document.getElementById('sigil-input') as HTMLInputElement

  registerSigilInput(input, canvas, display)
})
