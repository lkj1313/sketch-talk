import type {
  RoomDetailResponse,
  RoomParticipantResponse,
} from '@sketch-talk/contracts'
import { ArrowLeftIcon, LockIcon, UsersIcon } from 'lucide-react'

import { getRoomStatusLabel } from '@/entities/room'
import { JoinRoomForm } from '@/features/room-join'
import { RoomActions } from '@/features/room-manage'
import { Button } from '@/shared/ui'

export type RoomDetailsProps = {
  room: RoomDetailResponse
  currentParticipant: RoomParticipantResponse | null
  onBack: () => void
}

export function RoomDetails({
  room,
  currentParticipant,
  onBack,
}: RoomDetailsProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeftIcon aria-hidden="true" />
        로비로 돌아가기
      </Button>

      <section className="mt-4 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-3xl font-bold tracking-tight">
                {room.title}
              </h1>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {getRoomStatusLabel(room.status)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">
                방 코드 {room.code}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon aria-hidden="true" className="size-4" />
                {room.playerCount}/{room.maxPlayers}명
              </span>
              {room.visibility === 'PRIVATE' && (
                <span className="inline-flex items-center gap-1.5">
                  <LockIcon aria-hidden="true" className="size-4" />
                  비공개방
                </span>
              )}
            </div>
          </div>

          {currentParticipant && (
            <RoomActions
              code={room.code}
              status={room.status}
              participant={currentParticipant}
            />
          )}
        </div>

        {room.status === 'PLAYING' && (
          <p className="mt-6 rounded-xl bg-muted p-4 text-sm font-medium">
            게임이 진행 중입니다. 실시간 게임 화면 연결은 다음 단계에서
            추가됩니다.
          </p>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">참가자</h2>
            <span className="text-sm text-muted-foreground">
              방장 {room.host.nickname}
            </span>
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {room.participants.map((participant) => {
              const isCurrentParticipant =
                participant.id === currentParticipant?.id

              return (
                <li
                  key={participant.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {participant.nickname}
                      {isCurrentParticipant && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          나
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      점수 {participant.score}점
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {participant.isHost && (
                      <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                        방장
                      </span>
                    )}
                    {!participant.isHost && participant.isReady && (
                      <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                        준비 완료
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {!currentParticipant && (
        <div className="mt-6">
          <JoinRoomForm code={room.code} />
        </div>
      )}
    </div>
  )
}
