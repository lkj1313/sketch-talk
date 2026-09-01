import type { DrawingStroke } from '@sketch-talk/contracts'
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  drawStroke,
  getNormalizedPoint,
  resizeCanvas,
} from '../lib/canvas'
import {
  DEFAULT_DRAWING_COLOR,
  DEFAULT_DRAWING_WIDTH,
  type DrawingColor,
  type DrawingWidth,
} from './drawing-tool.constants'

type UseDrawingBoardOptions = {
  roundId: string
}

export function useDrawingBoard({ roundId }: UseDrawingBoardOptions) {
  const [color, setColor] = useState<DrawingColor>(DEFAULT_DRAWING_COLOR)
  const [width, setWidth] = useState<DrawingWidth>(DEFAULT_DRAWING_WIDTH)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const currentStrokeRef = useRef<DrawingStroke | null>(null)
  const completedStrokesRef = useRef<DrawingStroke[]>([])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    activePointerIdRef.current = null
    currentStrokeRef.current = null
    completedStrokesRef.current = []

    const handleResize = (): void => {
      resizeCanvas(canvas, completedStrokesRef.current)
    }
    const resizeObserver = new ResizeObserver(handleResize)

    resizeObserver.observe(canvas)
    handleResize()

    return () => resizeObserver.disconnect()
  }, [roundId])

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
    currentStrokeRef.current = {
      roundId,
      strokeId: crypto.randomUUID(),
      tool: 'PEN',
      color,
      width,
      points: [point],
    }
    event.currentTarget.setPointerCapture(event.pointerId)

    const context = event.currentTarget.getContext('2d')
    const bounds = event.currentTarget.getBoundingClientRect()

    if (context && currentStrokeRef.current) {
      drawStroke(
        context,
        currentStrokeRef.current,
        bounds.width,
        bounds.height,
      )
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
    const currentStroke = currentStrokeRef.current
    const previousPoint = currentStroke?.points.at(-1)

    if (!point || !currentStroke || !previousPoint) {
      return
    }

    currentStroke.points.push(point)

    const context = event.currentTarget.getContext('2d')
    const bounds = event.currentTarget.getBoundingClientRect()

    if (context) {
      drawStroke(
        context,
        {
          ...currentStroke,
          points: [previousPoint, point],
        },
        bounds.width,
        bounds.height,
      )
    }
  }

  function finishStroke(event: ReactPointerEvent<HTMLCanvasElement>): void {
    if (activePointerIdRef.current !== event.pointerId) {
      return
    }

    const currentStroke = currentStrokeRef.current

    if (currentStroke && currentStroke.points.length > 0) {
      completedStrokesRef.current.push(currentStroke)
    }

    currentStrokeRef.current = null
    activePointerIdRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return {
    canvasRef,
    color,
    finishStroke,
    handlePointerDown,
    handlePointerMove,
    setColor,
    setWidth,
    width,
  }
}
