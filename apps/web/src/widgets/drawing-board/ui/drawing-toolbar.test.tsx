import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DrawingToolbar } from './drawing-toolbar'

describe('DrawingToolbar', () => {
  it('선택된 색상과 굵기를 표시한다', () => {
    render(
      <DrawingToolbar
        color="#111827"
        tool="PEN"
        width={4}
        onColorChange={vi.fn()}
        onToolChange={vi.fn()}
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
        tool="PEN"
        width={4}
        onColorChange={onColorChange}
        onToolChange={vi.fn()}
        onWidthChange={onWidthChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '빨강 색상' }))
    fireEvent.click(screen.getByRole('button', { name: '굵게' }))

    expect(onColorChange).toHaveBeenCalledWith('#ef4444')
    expect(onWidthChange).toHaveBeenCalledWith(8)
  })

  it('지우개 선택을 전달하고 펜 설정을 비활성화한다', () => {
    const onToolChange = vi.fn()

    const { rerender } = render(
      <DrawingToolbar
        color="#111827"
        tool="PEN"
        width={4}
        onColorChange={vi.fn()}
        onToolChange={onToolChange}
        onWidthChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '지우개' }))
    expect(onToolChange).toHaveBeenCalledWith('ERASER')

    rerender(
      <DrawingToolbar
        color="#111827"
        tool="ERASER"
        width={4}
        onColorChange={vi.fn()}
        onToolChange={onToolChange}
        onWidthChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: '지우개' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '검정 색상' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '보통' })).toBeDisabled()
  })
})
