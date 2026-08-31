import type { RoomParticipantResponse, RoomStatus } from '@sketch-talk/contracts'
import { useNavigate } from 'react-router-dom'

import { Button, toast } from '@/shared/ui'

import { getRoomActionErrorMessage } from '../api/manage-room'
import {
  useLeaveRoom,
  useStartRoom,
  useUpdateReady,
} from '../model/use-room-actions'

type RoomActionsProps = {
  code: string
  status: RoomStatus
  participant: RoomParticipantResponse
}

export function RoomActions({ code, status, participant }: RoomActionsProps) {
  const navigate = useNavigate()
  const updateReadyMutation = useUpdateReady(code)
  const leaveRoomMutation = useLeaveRoom(code)
  const startRoomMutation = useStartRoom(code)
  const isPending =
    updateReadyMutation.isPending ||
    leaveRoomMutation.isPending ||
    startRoomMutation.isPending

  function handleReady(): void {
    const nextReady = !participant.isReady

    updateReadyMutation.mutate(nextReady, {
      onSuccess: () => {
        toast.add({
          title: nextReady ? '준비를 완료했습니다.' : '준비를 취소했습니다.',
          type: 'success',
        })
      },
      onError: (error) => {
        toast.add({
          title: '준비 상태를 변경하지 못했습니다.',
          description: getRoomActionErrorMessage(
            error,
            '준비 상태를 변경하지 못했습니다.',
          ),
          type: 'error',
        })
      },
    })
  }

  function handleLeave(): void {
    leaveRoomMutation.mutate(undefined, {
      onSuccess: () => {
        toast.add({
          title: '방에서 나왔습니다.',
          type: 'success',
        })
        void navigate('/lobby', { replace: true })
      },
      onError: (error) => {
        toast.add({
          title: '방에서 나가지 못했습니다.',
          description: getRoomActionErrorMessage(
            error,
            '방에서 나가지 못했습니다.',
          ),
          type: 'error',
        })
      },
    })
  }

  function handleStart(): void {
    startRoomMutation.mutate(undefined, {
      onSuccess: () => {
        toast.add({
          title: '게임을 시작했습니다.',
          type: 'success',
        })
      },
      onError: (error) => {
        toast.add({
          title: '게임을 시작하지 못했습니다.',
          description: getRoomActionErrorMessage(
            error,
            '게임을 시작하지 못했습니다.',
          ),
          type: 'error',
        })
      },
    })
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status === 'WAITING' &&
        (participant.isHost ? (
          <Button type="button" disabled={isPending} onClick={handleStart}>
            {startRoomMutation.isPending ? '시작하는 중...' : '게임 시작'}
          </Button>
        ) : (
          <Button
            type="button"
            variant={participant.isReady ? 'outline' : 'default'}
            disabled={isPending}
            onClick={handleReady}
          >
            {updateReadyMutation.isPending
              ? '변경하는 중...'
              : participant.isReady
                ? '준비 취소'
                : '준비하기'}
          </Button>
        ))}

      <Button
        type="button"
        variant="destructive"
        disabled={isPending}
        onClick={handleLeave}
      >
        {leaveRoomMutation.isPending ? '나가는 중...' : '방 나가기'}
      </Button>
    </div>
  )
}
