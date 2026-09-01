import type { RoomParticipantResponse, RoomStatus } from '@sketch-talk/contracts'

import { Button } from '@/shared/ui'

import { useRoomActionsController } from '../model/use-room-actions-controller'

type RoomActionsProps = {
  code: string
  status: RoomStatus
  participant: RoomParticipantResponse
}

export function RoomActions({ code, status, participant }: RoomActionsProps) {
  const {
    handleLeave,
    handleReady,
    handleStart,
    isLeavePending,
    isPending,
    isStartPending,
    isUpdateReadyPending,
  } = useRoomActionsController({ code, participant })

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status === 'WAITING' &&
        (participant.isHost ? (
          <Button type="button" disabled={isPending} onClick={handleStart}>
            {isStartPending ? '시작하는 중...' : '게임 시작'}
          </Button>
        ) : (
          <Button
            type="button"
            variant={participant.isReady ? 'outline' : 'default'}
            disabled={isPending}
            onClick={handleReady}
          >
            {isUpdateReadyPending
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
        {isLeavePending ? '나가는 중...' : '방 나가기'}
      </Button>
    </div>
  )
}
