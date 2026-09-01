import type { DrawingPoint } from '@sketch-talk/contracts'

const PEN_COLOR = '#111827'
const PEN_WIDTH = 4

export function getNormalizedPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): DrawingPoint | null {
  const bounds = canvas.getBoundingClientRect()

  if (bounds.width === 0 || bounds.height === 0) {
    return null
  }

  return {
    x: Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)),
    y: Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height)),
  }
}

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  completedStrokes: DrawingPoint[][],
): void {
  const bounds = canvas.getBoundingClientRect()
  const pixelRatio = window.devicePixelRatio || 1

  canvas.width = Math.round(bounds.width * pixelRatio)
  canvas.height = Math.round(bounds.height * pixelRatio)

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  completedStrokes.forEach((points) => {
    drawStroke(context, points, bounds.width, bounds.height)
  })
}

export function drawStroke(
  context: CanvasRenderingContext2D,
  points: DrawingPoint[],
  canvasWidth: number,
  canvasHeight: number,
): void {
  const firstPoint = points[0]

  if (!firstPoint) {
    return
  }

  context.strokeStyle = PEN_COLOR
  context.fillStyle = PEN_COLOR
  context.lineWidth = PEN_WIDTH
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (points.length === 1) {
    context.beginPath()
    context.arc(
      firstPoint.x * canvasWidth,
      firstPoint.y * canvasHeight,
      PEN_WIDTH / 2,
      0,
      Math.PI * 2,
    )
    context.fill()
    return
  }

  context.beginPath()
  context.moveTo(firstPoint.x * canvasWidth, firstPoint.y * canvasHeight)

  points.slice(1).forEach((point) => {
    context.lineTo(point.x * canvasWidth, point.y * canvasHeight)
  })

  context.stroke()
}
