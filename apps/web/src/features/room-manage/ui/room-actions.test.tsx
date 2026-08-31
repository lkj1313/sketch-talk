import type { RoomParticipantResponse } from '@sketch-talk/contracts'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RoomActions } from './room-actions'

const mocks = vi.hoisted(() => ({
  updateReady: vi.fn(),
  leaveRoom: vi.fn(),
  startRoom: vi.fn(),
  useUpdateReady: vi.fn(),
  useLeaveRoom: vi.fn(),
  useStartRoom: vi.fn(),
}))

vi.mock('../model/use-room-actions', () => ({
  useUpdateReady: mocks.useUpdateReady,
  useLeaveRoom: mocks.useLeaveRoom,
  useStartRoom: mocks.useStartRoom,
}))

const participant: RoomParticipantResponse = {
  id: 'participant-id',
  nickname: '참가자님',
  score: 0,
  isReady: false,
  isHost: false,
}

function renderActions(
  currentParticipant: RoomParticipantResponse = participant,
): void {
  render(
    <MemoryRouter>
      <RoomActions
        code="ABC234"
        status="WAITING"
        participant={currentParticipant}
      />
    </MemoryRouter>,
  )
}

describe('RoomActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useUpdateReady.mockReturnValue({
      mutate: mocks.updateReady,
      isPending: false,
    })
    mocks.useLeaveRoom.mockReturnValue({
      mutate: mocks.leaveRoom,
      isPending: false,
    })
    mocks.useStartRoom.mockReturnValue({
      mutate: mocks.startRoom,
      isPending: false,
    })
  })

  it('일반 참가자가 준비 상태를 변경한다', () => {
    renderActions()
    fireEvent.click(screen.getByRole('button', { name: '준비하기' }))

    expect(mocks.updateReady).toHaveBeenCalledWith(true, expect.any(Object))
    expect(screen.queryByRole('button', { name: '게임 시작' })).not.toBeInTheDocument()
  })

  it('준비된 참가자가 준비를 취소한다', () => {
    renderActions({ ...participant, isReady: true })
    fireEvent.click(screen.getByRole('button', { name: '준비 취소' }))

    expect(mocks.updateReady).toHaveBeenCalledWith(false, expect.any(Object))
  })

  it('방장에게 게임 시작 기능을 표시한다', () => {
    renderActions({ ...participant, isHost: true })
    fireEvent.click(screen.getByRole('button', { name: '게임 시작' }))

    expect(mocks.startRoom).toHaveBeenCalledWith(undefined, expect.any(Object))
    expect(screen.queryByRole('button', { name: '준비하기' })).not.toBeInTheDocument()
  })

  it('참가자가 방에서 나갈 수 있다', () => {
    renderActions()
    fireEvent.click(screen.getByRole('button', { name: '방 나가기' }))

    expect(mocks.leaveRoom).toHaveBeenCalledWith(undefined, expect.any(Object))
  })
})
