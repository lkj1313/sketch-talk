import { PaletteIcon } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@/shared/lib/cn'

import { useDrawingBoard } from '../model/use-drawing-board'

export type DrawingBoardProps = {
  className?: string
}

export function DrawingBoard({ className }: DrawingBoardProps) {
  const titleId = useId()
  const instructionId = useId()
  const {
    canvasRef,
    finishStroke,
    handlePointerDown,
    handlePointerMove,
  } = useDrawingBoard()

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
      </header>

      <div className="aspect-[4/3] w-full bg-white">
        <p id={instructionId} className="sr-only">
          마우스나 손가락을 누른 채 움직여 그림을 그릴 수 있습니다.
        </p>
        <canvas
          ref={canvasRef}
          aria-label="게임 그림판"
          aria-describedby={instructionId}
          className="block size-full touch-none cursor-crosshair"
          onPointerCancel={finishStroke}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
        />
      </div>
    </section>
  )
}
