import type { RoomListStatus } from '@sketch-talk/contracts'
import { useState } from 'react'

import { useRooms } from '@/entities/room'

const PAGE_SIZE = 12

export function useRoomList() {
  const [status, setStatus] = useState<RoomListStatus>('WAITING')
  const [page, setPage] = useState(1)
  const roomsQuery = useRooms({ page, pageSize: PAGE_SIZE, status })

  function changeStatus(nextStatus: RoomListStatus): void {
    setStatus(nextStatus)
    setPage(1)
  }

  function goToPreviousPage(): void {
    setPage((currentPage) => currentPage - 1)
  }

  function goToNextPage(): void {
    setPage((currentPage) => currentPage + 1)
  }

  function refetch(): void {
    void roomsQuery.refetch()
  }

  return {
    changeStatus,
    goToNextPage,
    goToPreviousPage,
    page,
    refetch,
    roomsQuery,
    status,
  }
}
