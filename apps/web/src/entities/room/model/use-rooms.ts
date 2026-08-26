import type { GetRoomsQuery } from '@sketch-talk/contracts'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getRooms } from '../api/get-rooms'
import { roomQueryKeys } from './room-query-keys'

export function useRooms(query: GetRoomsQuery) {
  return useQuery({
    queryKey: roomQueryKeys.list(query),
    queryFn: () => getRooms(query),
    placeholderData: keepPreviousData,
  })
}
