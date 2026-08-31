import type { CreateRoomRequest, RoomResponse } from '@sketch-talk/contracts'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session'
import { toast } from '@/shared/ui'

import { CreateRoomDialog } from './create-room-dialog'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  useCreateRoom: vi.fn(),
}))

vi.mock('../model/use-create-room', () => ({
  useCreateRoom: mocks.useCreateRoom,
}))

const createdRoom: RoomResponse = {
  id: 'room-id',
  code: 'ABC123',
  title: '새 그림방',
  status: 'WAITING',
  visibility: 'PUBLIC',
  maxPlayers: 8,
  allowMidJoin: true,
  playerCount: 1,
  host: {
    id: 'host-id',
    nickname: '방장님',
  },
  createdAt: '2026-08-26T00:00:00.000Z',
}

function renderCreateRoomDialog(): void {
  render(
    <MemoryRouter initialEntries={['/lobby']}>
      <Routes>
        <Route path="/lobby" element={<CreateRoomDialog />} />
        <Route path="/rooms/:roomCode" element={<h1>방 대기실</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function openDialog() {
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: '방 만들기' }))

  return {
    user,
    dialog: screen.getByRole('dialog', { name: '새 방 만들기' }),
  }
}

describe('CreateRoomDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSessionStore.getState().clearSession()
    mocks.useCreateRoom.mockReturnValue({
      mutate: mocks.mutate,
      isPending: false,
    })
  })

  it('비회원에게 닉네임 입력란을 표시한다', async () => {
    renderCreateRoomDialog()
    const { dialog } = await openDialog()

    expect(within(dialog).getByLabelText('닉네임')).toBeInTheDocument()
  })

  it('회원에게 닉네임 입력란을 표시하지 않는다', async () => {
    useSessionStore.getState().setSession('access-token', {
      id: 'user-id',
      email: 'member@example.com',
      nickname: '회원님',
      avatarUrl: null,
      createdAt: '2026-08-26T00:00:00.000Z',
    })
    renderCreateRoomDialog()
    const { dialog } = await openDialog()

    expect(within(dialog).queryByLabelText('닉네임')).not.toBeInTheDocument()
  })

  it('비회원의 필수 입력값을 검증한다', async () => {
    renderCreateRoomDialog()
    const { user, dialog } = await openDialog()

    await user.click(within(dialog).getByRole('button', { name: '방 만들기' }))

    expect(await screen.findByText('방 제목을 입력해주세요.')).toBeInTheDocument()
    expect(
      screen.getByText('닉네임은 2자 이상이어야 합니다.'),
    ).toBeInTheDocument()
    expect(mocks.mutate).not.toHaveBeenCalled()
  })

  it('입력한 설정으로 방을 만들고 대기실로 이동한다', async () => {
    const toastSpy = vi.spyOn(toast, 'add')
    mocks.mutate.mockImplementation(
      (
        _request: CreateRoomRequest,
        options: { onSuccess?: (room: RoomResponse) => void },
      ) => {
        options.onSuccess?.(createdRoom)
      },
    )
    renderCreateRoomDialog()
    const { user, dialog } = await openDialog()

    await user.type(within(dialog).getByLabelText('방 제목'), '새 그림방')
    await user.type(within(dialog).getByLabelText('닉네임'), '게스트님')
    await user.selectOptions(within(dialog).getByLabelText('공개 여부'), 'PRIVATE')
    await user.selectOptions(within(dialog).getByLabelText('최대 인원'), '6')
    await user.click(
      within(dialog).getByRole('checkbox', { name: /중간 참가 허용/ }),
    )
    await user.click(within(dialog).getByRole('button', { name: '방 만들기' }))

    await waitFor(() => {
      expect(mocks.mutate).toHaveBeenCalledWith(
        {
          title: '새 그림방',
          nickname: '게스트님',
          visibility: 'PRIVATE',
          maxPlayers: 6,
          allowMidJoin: false,
        },
        expect.any(Object),
      )
    })
    expect(
      await screen.findByRole('heading', { name: '방 대기실' }),
    ).toBeInTheDocument()
    expect(toastSpy).toHaveBeenCalledWith({
      title: '방을 만들었습니다.',
      type: 'success',
    })
  })

  it('방 생성에 실패하면 오류 알림을 표시한다', async () => {
    const toastSpy = vi.spyOn(toast, 'add')
    mocks.mutate.mockImplementation(
      (
        _request: CreateRoomRequest,
        options: { onError?: (error: Error) => void },
      ) => {
        options.onError?.(new Error('요청 실패'))
      },
    )
    renderCreateRoomDialog()
    const { user, dialog } = await openDialog()

    await user.type(within(dialog).getByLabelText('방 제목'), '새 그림방')
    await user.type(within(dialog).getByLabelText('닉네임'), '게스트님')
    await user.click(within(dialog).getByRole('button', { name: '방 만들기' }))

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith({
        title: '방을 만들지 못했습니다.',
        description: '방을 만들지 못했습니다.',
        type: 'error',
      })
    })
  })
})
