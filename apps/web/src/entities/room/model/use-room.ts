import { useQuery } from '@tanstack/react-query'

import { getCurrentRoomParticipant, getRoom } from '../api/get-room'
import { roomQueryKeys } from './room-query-keys'

export function useRoom(code: string) {
  return useQuery({
    queryKey: roomQueryKeys.detail(code),
    queryFn: () => getRoom(code),
    enabled: code.length > 0,
  })
}

export function useCurrentRoomParticipant(code: string) {
  return useQuery({
    queryKey: roomQueryKeys.currentParticipant(code),
    queryFn: () => getCurrentRoomParticipant(code),
    enabled: code.length > 0,
  })
}
