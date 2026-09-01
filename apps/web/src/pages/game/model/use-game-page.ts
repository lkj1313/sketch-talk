import { useParams } from 'react-router-dom'

import { useCurrentRoomParticipant } from '@/entities/room'
import { useGameRealtime } from '@/features/game-realtime'

import { useRoundCountdown } from './use-round-countdown'

export function useGamePage() {
  const { roomCode = '', gameId = '' } = useParams()
  const normalizedRoomCode = roomCode.trim().toUpperCase()
  const currentParticipantQuery = useCurrentRoomParticipant(normalizedRoomCode)
  const realtime = useGameRealtime({
    roomCode: normalizedRoomCode,
    gameId,
  })
  const remainingSeconds = useRoundCountdown(realtime.gameState?.expiresAt)

  return {
    ...realtime,
    currentParticipantId: currentParticipantQuery.data?.id,
    isChatDisabled: !realtime.isConnected || !realtime.gameState,
    remainingSeconds,
    roomCode: normalizedRoomCode,
  }
}
