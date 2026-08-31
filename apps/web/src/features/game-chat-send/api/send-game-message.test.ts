import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendGameMessage } from './send-game-message'

const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  ROOM_SOCKET_EVENT: {
    MESSAGE: 'game:message',
  },
  roomSocket: {
    emit: mocks.emit,
  },
}))

describe('sendGameMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('게임 메시지 이벤트와 메시지 본문을 전송한다', () => {
    sendGameMessage('안녕하세요')

    expect(mocks.emit).toHaveBeenCalledWith('game:message', {
      message: '안녕하세요',
    })
  })
})
