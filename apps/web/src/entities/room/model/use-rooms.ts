import type { GetRoomsQuery } from '@sketch-talk/contracts'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getRooms } from '../api/get-rooms'

export function useRooms(query: GetRoomsQuery) {
  return useQuery({
    queryKey: ['rooms', query],
    queryFn: () => getRooms(query),
    placeholderData: keepPreviousData,
  })
}
