import type { DrawingStroke } from '@sketch-talk/contracts'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDrawingBoard } from './use-drawing-board'

const mocks = vi.hoisted(() => ({
  clearCanvas: vi.fn(),
  drawStroke: vi.fn(),
  getNormalizedPoint: vi.fn(() => ({ x: 0.2, y: 0.3 })),
  redrawCanvas: vi.fn(),
  resizeCanvas: vi.fn(),
}))

vi.mock('../lib/canvas', () => mocks)

function createCanvas() {
  return {
    getBoundingClientRect: vi.fn(() => ({
      width: 800,
      height: 600,
    })),
    getContext: vi.fn(() => ({})),
    hasPointerCapture: vi.fn(() => true),
    releasePointerCapture: vi.fn(),
    setPointerCapture: vi.fn(),
  }
}

function createPointerEvent(
  canvas: ReturnType<typeof createCanvas>,
  pointerId = 1,
) {
  return {
    clientX: 160,
    clientY: 180,
    currentTarget: canvas,
    pointerId,
  }
}

describe('useDrawingBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('출제자가 완성한 선을 로컬에 반영하고 외부로 전달한다', () => {
    const onStrokeComplete = vi.fn()
    const { result } = renderHook(() =>
      useDrawingBoard({
        roundId: 'round-id',
        canDraw: true,
        strokes: [],
        onStrokeComplete,
      }),
    )
    const canvas = createCanvas()
    const event = createPointerEvent(canvas)

    act(() => {
      result.current.handlePointerDown(event as never)
      result.current.handlePointerMove(event as never)
      result.current.finishStroke(event as never)
    })

    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1)
    expect(mocks.drawStroke).toHaveBeenCalled()
    expect(onStrokeComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        roundId: 'round-id',
        tool: 'PEN',
        color: '#111827',
        width: 4,
        points: [
          { x: 0.2, y: 0.3 },
          { x: 0.2, y: 0.3 },
        ],
      }),
    )
  })

  it('출제자가 아니면 포인터 입력을 무시한다', () => {
    const onStrokeComplete = vi.fn()
    const { result } = renderHook(() =>
      useDrawingBoard({
        roundId: 'round-id',
        canDraw: false,
        strokes: [],
        onStrokeComplete,
      }),
    )
    const canvas = createCanvas()
    const event = createPointerEvent(canvas)

    act(() => {
      result.current.handlePointerDown(event as never)
      result.current.handlePointerMove(event as never)
      result.current.finishStroke(event as never)
    })

    expect(mocks.getNormalizedPoint).not.toHaveBeenCalled()
    expect(onStrokeComplete).not.toHaveBeenCalled()
  })

  it('서버에서 받은 현재 라운드의 그림을 다시 그린다', () => {
    const initialProps: { strokes: DrawingStroke[] } = { strokes: [] }
    const { result, rerender } = renderHook(
      ({ strokes }: { strokes: DrawingStroke[] }) =>
        useDrawingBoard({
          roundId: 'round-id',
          canDraw: false,
          strokes,
        }),
      { initialProps },
    )
    const canvas = createCanvas()
    const currentStroke = {
      roundId: 'round-id',
      strokeId: 'current-stroke-id',
      tool: 'PEN',
      color: '#ef4444',
      width: 8,
      points: [{ x: 0.4, y: 0.5 }],
    } satisfies DrawingStroke
    const oldStroke = {
      ...currentStroke,
      roundId: 'old-round-id',
      strokeId: 'old-stroke-id',
    } satisfies DrawingStroke

    result.current.canvasRef.current = canvas as never
    rerender({ strokes: [oldStroke, currentStroke] })

    expect(mocks.redrawCanvas).toHaveBeenCalledWith(canvas, [currentStroke])
  })

  it('전체 지우기는 진행 중인 입력과 캔버스를 비운 뒤 알린다', () => {
    const onClear = vi.fn()
    const { result } = renderHook(() =>
      useDrawingBoard({
        roundId: 'round-id',
        canDraw: true,
        strokes: [],
        onClear,
      }),
    )
    const canvas = createCanvas()

    result.current.canvasRef.current = canvas as never

    act(() => {
      result.current.handlePointerDown(createPointerEvent(canvas) as never)
      result.current.clearDrawing()
    })

    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(1)
    expect(mocks.clearCanvas).toHaveBeenCalledWith(canvas)
    expect(onClear).toHaveBeenCalledOnce()
  })
})
