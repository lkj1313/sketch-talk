export const DRAWING_COLORS = [
  { label: '검정', value: '#111827' },
  { label: '빨강', value: '#ef4444' },
  { label: '파랑', value: '#3b82f6' },
  { label: '초록', value: '#22c55e' },
  { label: '노랑', value: '#eab308' },
] as const

export const DRAWING_WIDTHS = [
  { label: '얇게', value: 2 },
  { label: '보통', value: 4 },
  { label: '굵게', value: 8 },
] as const

export type DrawingColor = (typeof DRAWING_COLORS)[number]['value']
export type DrawingWidth = (typeof DRAWING_WIDTHS)[number]['value']

export const DEFAULT_DRAWING_COLOR: DrawingColor = '#111827'
export const DEFAULT_DRAWING_WIDTH: DrawingWidth = 4
export const DRAWING_ERASER_WIDTH = 20
