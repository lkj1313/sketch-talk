import type { RoomResponse } from '@sketch-talk/contracts'
import { GlobeIcon, UsersIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

type RoomCardProps = {
  room: RoomResponse
}

const ROOM_STATUS_LABEL = {
  WAITING: '대기 중',
  PLAYING: '게임 중',
  FINISHED: '종료',
  CLOSED: '닫힘',
} as const

export function RoomCard({ room }: RoomCardProps) {
  const isFull = room.playerCount >= room.maxPlayers

  return (
    <Link
      className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      to={`/rooms/${room.code}`}
      aria-label={`${room.title} 방 보기`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-lg font-semibold group-hover:underline">
            {room.title}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            방장 {room.host.nickname}
          </p>
        </div>
        <span
          className={
            room.status === 'WAITING'
              ? 'shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground'
              : 'shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground'
          }
        >
          {ROOM_STATUS_LABEL[room.status]}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <GlobeIcon aria-hidden="true" className="size-4" />
          공개방
        </span>
        <span
          className={`inline-flex items-center gap-1.5 ${isFull ? 'text-destructive' : ''}`}
        >
          <UsersIcon aria-hidden="true" className="size-4" />
          {room.playerCount}/{room.maxPlayers}
          {isFull && ' · 가득 참'}
        </span>
      </div>
    </Link>
  )
}
