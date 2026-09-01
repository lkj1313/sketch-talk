import { useNavigate, useParams } from 'react-router-dom'

import { useCurrentRoomParticipant, useRoom } from '@/entities/room'
import { useRoomRealtime } from '@/features/room-realtime'

import { isValidRoomCode, normalizeRoomCode } from '../lib/room-code'

export function useRoomPage() {
  const navigate = useNavigate()
  const { roomCode: rawRoomCode = '' } = useParams()
  const normalizedRoomCode = normalizeRoomCode(rawRoomCode)
  const isValid = isValidRoomCode(normalizedRoomCode)
  const roomCode = isValid ? normalizedRoomCode : ''
  const roomQuery = useRoom(roomCode)
  const currentParticipantQuery = useCurrentRoomParticipant(roomCode)

  useRoomRealtime({
    code: roomCode,
    enabled: Boolean(currentParticipantQuery.data),
  })

  function goToLobby(): void {
    void navigate('/lobby')
  }

  function retry(): void {
    void roomQuery.refetch()
    void currentParticipantQuery.refetch()
  }

  if (!isValid) {
    return { status: 'invalid', goToLobby } as const
  }

  if (roomQuery.isPending || currentParticipantQuery.isPending) {
    return { status: 'loading' } as const
  }

  if (roomQuery.isError || currentParticipantQuery.isError) {
    return { status: 'error', retry } as const
  }

  return {
    status: 'ready',
    currentParticipant: currentParticipantQuery.data,
    goToLobby,
    room: roomQuery.data,
  } as const
}
