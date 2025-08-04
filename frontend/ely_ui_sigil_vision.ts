// Types
export type SigilResult = number | string

// Function to calculate a sigil value based on input strength
export function calculateSigilStrength(input: number): SigilResult {
  if (input < 0) {
    return `Shadow Essence: ${input}`
  } else if (input % 2 === 0) {
    return input * input
  } else {
    return `Bright Essence: ${input}`
  }
}

// Interface for UI options
export interface SigilUIOptions {
  containerId: string
  width?: number
  height?: number
  backgroundColor?: string
  lineColor?: string
  lineWidthBase?: number
  sides?: number
}

// Initializes the vision canvas for sigils
export function initializeSigilVision(options: SigilUIOptions): HTMLCanvasElement {
  const container = document.getElementById(options.containerId)
  if (!container) {
    throw new Error(`Container with id ${options.containerId} not found`)
  }

  const canvas = document.createElement('canvas')
  canvas.width = options.width ?? 400
  canvas.height = options.height ?? 300
  canvas.style.background = options.backgroundColor ?? '#0e0e1f'
  canvas.style.display = 'block'
  canvas.style.margin = '0 auto'

  // Support high-DPI displays
  const dpr = window.devicePixelRatio || 1
  canvas.width *= dpr
  canvas.height *= dpr
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)

  container.appendChild(canvas)
  return canvas
}

// Draws a sigil pattern based on strength and options
export function drawSigil(
  canvas: HTMLCanvasElement,
  strength: number,
  opts: {
    sides: number
    lineColor: string
    lineWidth: number
  }
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { sides, lineColor, lineWidth } = opts
  const cw = canvas.width / (window.devicePixelRatio || 1)
  const ch = canvas.height / (window.devicePixelRatio || 1)
  const centerX = cw / 2
  const centerY = ch / 2
  const radius = Math.min(centerX, centerY) * Math.min(strength / 10, 1)

  ctx.clearRect(0, 0, cw, ch)
  ctx.strokeStyle = lineColor
  ctx.lineWidth = lineWidth

  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i + (strength % 360) * (Math.PI/180)
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()
}

// Updates the displayed sigil value and redraws pattern
export function updateSigilDisplay(
  input: number,
  canvas: HTMLCanvasElement,
  displayElement: HTMLElement,
  uiOpts: SigilUIOptions
): void {
  const result = calculateSigilStrength(input)
  displayElement.textContent = String(result)

  const strength = typeof result === 'number' ? result : Math.abs(input)
  const sides = uiOpts.sides ?? 6
  const lineColor = uiOpts.lineColor ?? '#80d8ff'
  const base = uiOpts.lineWidthBase ?? 2
  const lineWidth = base + (strength % 5)

  drawSigil(canvas, strength, { sides, lineColor, lineWidth })
}

// Registers input events to update vision in real-time
export function registerSigilInput(
  inputElement: HTMLInputElement,
  canvas: HTMLCanvasElement,
  displayElement: HTMLElement,
  uiOpts: SigilUIOptions
): void {
  inputElement.addEventListener('input', () => {
    const value = parseInt(inputElement.value, 10) || 0
    updateSigilDisplay(value, canvas, displayElement, uiOpts)
  })
}

// Example initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const uiOpts: SigilUIOptions = {
    containerId: 'sigil-vision',
    width: 500,
    height: 400,
    backgroundColor: '#111122',
    lineColor: '#a0e0ff',
    lineWidthBase: 3,
    sides: 8,
  }
  const canvas = initializeSigilVision(uiOpts)
  const display = document.getElementById('sigil-result')!
  const input = document.getElementById('sigil-input') as HTMLInputElement

  // draw initial
  updateSigilDisplay(parseInt(input.value, 10) || 0, canvas, display, uiOpts)
  registerSigilInput(input, canvas, display, uiOpts)
})
