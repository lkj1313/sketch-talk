import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DrawingToolbar } from './drawing-toolbar'

describe('DrawingToolbar', () => {
  it('선택된 색상과 굵기를 표시한다', () => {
    render(
      <DrawingToolbar
        color="#111827"
        width={4}
        onColorChange={vi.fn()}
        onWidthChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: '검정 색상' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '보통' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('색상과 굵기 변경을 전달한다', () => {
    const onColorChange = vi.fn()
    const onWidthChange = vi.fn()

    render(
      <DrawingToolbar
        color="#111827"
        width={4}
        onColorChange={onColorChange}
        onWidthChange={onWidthChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '빨강 색상' }))
    fireEvent.click(screen.getByRole('button', { name: '굵게' }))

    expect(onColorChange).toHaveBeenCalledWith('#ef4444')
    expect(onWidthChange).toHaveBeenCalledWith(8)
  })
})
