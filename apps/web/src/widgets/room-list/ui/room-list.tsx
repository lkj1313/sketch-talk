import type { RoomListStatus } from '@sketch-talk/contracts'
import { RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'

import { RoomCard, useRooms } from '@/entities/room'
import { Button, Spinner } from '@/shared/ui'

const PAGE_SIZE = 12

export function RoomList() {
  const [status, setStatus] = useState<RoomListStatus>('WAITING')
  const [page, setPage] = useState(1)
  const roomsQuery = useRooms({ page, pageSize: PAGE_SIZE, status })

  function changeStatus(nextStatus: RoomListStatus): void {
    setStatus(nextStatus)
    setPage(1)
  }

  return (
    <section aria-labelledby="room-list-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-xl bg-muted p-1"
          aria-label="방 상태 필터"
        >
          <Button
            type="button"
            variant={status === 'WAITING' ? 'default' : 'ghost'}
            aria-pressed={status === 'WAITING'}
            onClick={() => changeStatus('WAITING')}
          >
            대기 중
          </Button>
          <Button
            type="button"
            variant={status === 'PLAYING' ? 'default' : 'ghost'}
            aria-pressed={status === 'PLAYING'}
            onClick={() => changeStatus('PLAYING')}
          >
            게임 중
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={roomsQuery.isFetching}
          onClick={() => void roomsQuery.refetch()}
        >
          <RefreshCwIcon
            aria-hidden="true"
            className={roomsQuery.isFetching ? 'animate-spin' : ''}
          />
          {roomsQuery.isFetching ? '새로고침 중' : '새로고침'}
        </Button>
      </div>

      <h2 id="room-list-heading" className="sr-only">
        조회된 게임방
      </h2>

      {roomsQuery.isPending ? (
        <div className="flex min-h-72 items-center justify-center">
          <Spinner className="size-8" aria-label="방 목록 불러오는 중" />
        </div>
      ) : roomsQuery.isError ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
          <div className="space-y-1">
            <p className="font-semibold">방 목록을 불러오지 못했습니다.</p>
            <p className="text-sm text-muted-foreground">
              네트워크 연결을 확인한 후 다시 시도해주세요.
            </p>
          </div>
          <Button type="button" onClick={() => void roomsQuery.refetch()}>
            다시 시도
          </Button>
        </div>
      ) : roomsQuery.data.rooms.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-background/70 text-center">
          <p className="font-semibold">
            {status === 'WAITING'
              ? '현재 대기 중인 방이 없습니다.'
              : '현재 게임 중인 방이 없습니다.'}
          </p>
          <p className="text-sm text-muted-foreground">
            잠시 후 새로고침해주세요.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roomsQuery.data.rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      {roomsQuery.data && roomsQuery.data.meta.total > 0 && (
        <nav
          className="mt-8 flex items-center justify-center gap-3"
          aria-label="방 목록 페이지"
        >
          <Button
            type="button"
            variant="outline"
            disabled={page === 1 || roomsQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            이전
          </Button>
          <span className="min-w-16 text-center text-sm text-muted-foreground">
            {page}페이지
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={!roomsQuery.data.meta.hasNext || roomsQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            다음
          </Button>
        </nav>
      )}
    </section>
  )
}
