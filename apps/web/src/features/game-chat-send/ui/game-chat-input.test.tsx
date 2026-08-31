import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { GameChatInput } from './game-chat-input'

describe('GameChatInput', () => {
  it('입력한 메시지를 전송하고 입력창을 비운다', async () => {
    const user = userEvent.setup()
    const onSendMessage = vi.fn()

    render(<GameChatInput onSendMessage={onSendMessage} />)

    const input = screen.getByRole('textbox', { name: '채팅 메시지' })

    await user.type(input, ' 안녕하세요! ')
    await user.click(screen.getByRole('button', { name: '메시지 전송' }))

    expect(onSendMessage).toHaveBeenCalledWith('안녕하세요!')
    expect(input).toHaveValue('')
  })

  it('Enter 키로 메시지를 전송한다', async () => {
    const user = userEvent.setup()
    const onSendMessage = vi.fn()

    render(<GameChatInput onSendMessage={onSendMessage} />)

    const input = screen.getByRole('textbox', { name: '채팅 메시지' })

    await user.type(input, '반갑습니다.{Enter}')

    expect(onSendMessage).toHaveBeenCalledWith('반갑습니다.')
    expect(input).toHaveValue('')
  })

  it('공백만 입력하면 메시지를 전송하지 않는다', async () => {
    const user = userEvent.setup()
    const onSendMessage = vi.fn()

    render(<GameChatInput onSendMessage={onSendMessage} />)

    const input = screen.getByRole('textbox', { name: '채팅 메시지' })

    await user.type(input, '   ')

    expect(screen.getByRole('button', { name: '메시지 전송' })).toBeDisabled()
    await user.type(input, '{Enter}')
    expect(onSendMessage).not.toHaveBeenCalled()
  })
})
