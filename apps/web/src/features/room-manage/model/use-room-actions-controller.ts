import type { RoomParticipantResponse } from '@sketch-talk/contracts'
import { useNavigate } from 'react-router-dom'

import { toast } from '@/shared/ui'

import { getRoomActionErrorMessage } from '../api/manage-room'
import {
  useLeaveRoom,
  useStartRoom,
  useUpdateReady,
} from './use-room-actions'

type UseRoomActionsControllerOptions = {
  code: string
  participant: RoomParticipantResponse
}

export function useRoomActionsController({
  code,
  participant,
}: UseRoomActionsControllerOptions) {
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

  return {
    handleLeave,
    handleReady,
    handleStart,
    isLeavePending: leaveRoomMutation.isPending,
    isPending,
    isStartPending: startRoomMutation.isPending,
    isUpdateReadyPending: updateReadyMutation.isPending,
  }
}
