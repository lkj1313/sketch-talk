import type { DrawingStroke } from '@sketch-talk/contracts'
import { EyeIcon, PaletteIcon } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@/shared/lib/cn'

import { useDrawingBoard } from '../model/use-drawing-board'
import { DrawingToolbar } from './drawing-toolbar'

export type DrawingBoardProps = {
  roundId: string
  canDraw: boolean
  strokes: DrawingStroke[]
  className?: string
  onClear?: () => void
  onStrokeComplete?: (stroke: DrawingStroke) => void
}

export function DrawingBoard({
  roundId,
  canDraw,
  strokes,
  className,
  onClear,
  onStrokeComplete,
}: DrawingBoardProps) {
  const titleId = useId()
  const instructionId = useId()
  const {
    canvasRef,
    clearDrawing,
    color,
    finishStroke,
    handlePointerDown,
    handlePointerMove,
    setColor,
    setTool,
    setWidth,
    tool,
    width,
  } = useDrawingBoard({
    roundId,
    canDraw,
    strokes,
    onClear,
    onStrokeComplete,
  })

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'w-full overflow-hidden rounded-2xl border bg-card shadow-sm',
        className,
      )}
    >
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <PaletteIcon aria-hidden="true" className="size-5" />
        <h2 id={titleId} className="font-semibold">
          그림판
        </h2>
        {!canDraw && (
          <span className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
            <EyeIcon aria-hidden="true" className="size-4" />
            관전 중
          </span>
        )}
      </header>

      {canDraw && (
        <DrawingToolbar
          color={color}
          tool={tool}
          width={width}
          onClear={clearDrawing}
          onColorChange={setColor}
          onToolChange={setTool}
          onWidthChange={setWidth}
        />
      )}

      <div className="aspect-[4/3] w-full bg-white">
        <p id={instructionId} className="sr-only">
          {canDraw
            ? '마우스나 손가락을 누른 채 움직여 그림을 그릴 수 있습니다.'
            : '출제자가 그리고 있는 그림을 실시간으로 볼 수 있습니다.'}
        </p>
        <canvas
          ref={canvasRef}
          aria-label="게임 그림판"
          aria-describedby={instructionId}
          aria-readonly={!canDraw}
          className={cn(
            'block size-full touch-none',
            canDraw ? 'cursor-crosshair' : 'cursor-default',
          )}
          onPointerCancel={canDraw ? finishStroke : undefined}
          onPointerDown={canDraw ? handlePointerDown : undefined}
          onPointerMove={canDraw ? handlePointerMove : undefined}
          onPointerUp={canDraw ? finishStroke : undefined}
        />
      </div>
    </section>
  )
}
