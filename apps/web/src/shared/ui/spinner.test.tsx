import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Spinner } from './spinner'

describe('Spinner', () => {
  it('기본 로딩 상태를 표시한다', () => {
    render(<Spinner />)

    expect(
      screen.getByRole('status', { name: '로딩 중' }),
    ).toBeInTheDocument()
  })

  it('전달받은 접근성 설명을 표시한다', () => {
    render(<Spinner aria-label="로그인 상태 확인 중" />)

    expect(
      screen.getByRole('status', { name: '로그인 상태 확인 중' }),
    ).toBeInTheDocument()
  })
})
