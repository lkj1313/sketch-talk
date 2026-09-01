import type { DrawingTool } from '@sketch-talk/contracts'
import { EraserIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/shared/ui'

import {
  DRAWING_COLORS,
  DRAWING_WIDTHS,
  type DrawingColor,
  type DrawingWidth,
} from '../model/drawing-tool.constants'

type DrawingToolbarProps = {
  color: DrawingColor
  tool: DrawingTool
  width: DrawingWidth
  onClear: () => void
  onColorChange: (color: DrawingColor) => void
  onToolChange: (tool: DrawingTool) => void
  onWidthChange: (width: DrawingWidth) => void
}

export function DrawingToolbar({
  color,
  tool,
  width,
  onClear,
  onColorChange,
  onToolChange,
  onWidthChange,
}: DrawingToolbarProps) {
  return (
    <div
      aria-label="그림 도구"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b bg-muted/30 px-4 py-3"
      role="toolbar"
    >
      <div aria-label="그리기 도구" className="flex items-center gap-1" role="group">
        <Button
          aria-pressed={tool === 'PEN'}
          onClick={() => onToolChange('PEN')}
          type="button"
          variant={tool === 'PEN' ? 'secondary' : 'ghost'}
        >
          <PencilIcon aria-hidden="true" />
          펜
        </Button>
        <Button
          aria-pressed={tool === 'ERASER'}
          onClick={() => onToolChange('ERASER')}
          type="button"
          variant={tool === 'ERASER' ? 'secondary' : 'ghost'}
        >
          <EraserIcon aria-hidden="true" />
          지우개
        </Button>
      </div>

      <div aria-label="펜 색상" className="flex items-center gap-2" role="group">
        <span className="text-sm font-medium">색상</span>
        {DRAWING_COLORS.map((option) => {
          const isSelected = color === option.value

          return (
            <button
              key={option.value}
              aria-label={`${option.label} 색상`}
              aria-pressed={isSelected}
              className="size-7 rounded-full border-2 border-background shadow-sm outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-2"
              disabled={tool === 'ERASER'}
              onClick={() => onColorChange(option.value)}
              style={{ backgroundColor: option.value }}
              title={option.label}
              type="button"
            />
          )
        })}
      </div>

      <div aria-label="펜 굵기" className="flex items-center gap-1" role="group">
        <span className="mr-1 text-sm font-medium">굵기</span>
        {DRAWING_WIDTHS.map((option) => {
          const isSelected = width === option.value

          return (
            <Button
              key={option.value}
              aria-pressed={isSelected}
              disabled={tool === 'ERASER'}
              onClick={() => onWidthChange(option.value)}
              type="button"
              variant={isSelected ? 'secondary' : 'ghost'}
            >
              <span
                aria-hidden="true"
                className="w-6 rounded-full bg-current"
                style={{ height: option.value }}
              />
              {option.label}
            </Button>
          )
        })}
      </div>

      <Button
        className="ml-auto"
        onClick={onClear}
        type="button"
        variant="destructive"
      >
        <Trash2Icon aria-hidden="true" />
        전체 지우기
      </Button>
    </div>
  )
}
