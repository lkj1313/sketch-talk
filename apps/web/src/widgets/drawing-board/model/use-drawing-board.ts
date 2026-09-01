import type { DrawingPoint } from '@sketch-talk/contracts'
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
} from 'react'

import {
  drawStroke,
  getNormalizedPoint,
  resizeCanvas,
} from '../lib/canvas'

export function useDrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const currentPointsRef = useRef<DrawingPoint[]>([])
  const completedStrokesRef = useRef<DrawingPoint[][]>([])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const handleResize = (): void => {
      resizeCanvas(canvas, completedStrokesRef.current)
    }
    const resizeObserver = new ResizeObserver(handleResize)

    resizeObserver.observe(canvas)
    handleResize()

    return () => resizeObserver.disconnect()
  }, [])

  function handlePointerDown(
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): void {
    if (activePointerIdRef.current !== null) {
      return
    }

    const point = getNormalizedPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    )

    if (!point) {
      return
    }

    activePointerIdRef.current = event.pointerId
    currentPointsRef.current = [point]
    event.currentTarget.setPointerCapture(event.pointerId)

    const context = event.currentTarget.getContext('2d')
    const bounds = event.currentTarget.getBoundingClientRect()

    if (context) {
      drawStroke(context, [point], bounds.width, bounds.height)
    }
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): void {
    if (activePointerIdRef.current !== event.pointerId) {
      return
    }

    const point = getNormalizedPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    )
    const previousPoint = currentPointsRef.current.at(-1)

    if (!point || !previousPoint) {
      return
    }

    currentPointsRef.current.push(point)

    const context = event.currentTarget.getContext('2d')
    const bounds = event.currentTarget.getBoundingClientRect()

    if (context) {
      drawStroke(
        context,
        [previousPoint, point],
        bounds.width,
        bounds.height,
      )
    }
  }

  function finishStroke(event: ReactPointerEvent<HTMLCanvasElement>): void {
    if (activePointerIdRef.current !== event.pointerId) {
      return
    }

    if (currentPointsRef.current.length > 0) {
      completedStrokesRef.current.push(currentPointsRef.current)
    }

    currentPointsRef.current = []
    activePointerIdRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return {
    canvasRef,
    finishStroke,
    handlePointerDown,
    handlePointerMove,
  }
}
