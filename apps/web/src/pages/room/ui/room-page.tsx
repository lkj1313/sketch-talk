import { ArrowLeftIcon, LockIcon, UsersIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { useCurrentRoomParticipant, useRoom } from '@/entities/room'
import { JoinRoomForm } from '@/features/room/join'
import { RoomActions } from '@/features/room/manage'
import { Button, Spinner } from '@/shared/ui'

const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/

const ROOM_STATUS_LABEL = {
  WAITING: '대기 중',
  PLAYING: '게임 중',
  FINISHED: '종료',
  CLOSED: '닫힘',
} as const

export function RoomPage() {
  const navigate = useNavigate()
  const { roomCode: rawRoomCode = '' } = useParams()
  const normalizedRoomCode = rawRoomCode.trim().toUpperCase()
  const isValidRoomCode = ROOM_CODE_PATTERN.test(normalizedRoomCode)
  const roomCode = isValidRoomCode ? normalizedRoomCode : ''
  const roomQuery = useRoom(roomCode)
  const currentParticipantQuery = useCurrentRoomParticipant(roomCode)

  if (!isValidRoomCode) {
    return (
      <RoomErrorState
        title="올바르지 않은 방 코드입니다."
        description="6자리 초대 코드를 다시 확인해주세요."
        onRetry={() => void navigate('/lobby')}
        retryLabel="로비로 이동"
      />
    )
  }

  if (roomQuery.isPending || currentParticipantQuery.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <Spinner className="size-8" aria-label="방 정보 불러오는 중" />
      </main>
    )
  }

  if (roomQuery.isError || currentParticipantQuery.isError) {
    return (
      <RoomErrorState
        title="방 정보를 불러오지 못했습니다."
        description="방이 존재하는지 확인한 후 다시 시도해주세요."
        onRetry={() => {
          void roomQuery.refetch()
          void currentParticipantQuery.refetch()
        }}
        retryLabel="다시 시도"
      />
    )
  }

  const room = roomQuery.data
  const currentParticipant = currentParticipantQuery.data

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => void navigate('/lobby')}
        >
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
                  {ROOM_STATUS_LABEL[room.status]}
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
    </main>
  )
}

type RoomErrorStateProps = {
  title: string
  description: string
  retryLabel: string
  onRetry: () => void
}

function RoomErrorState({
  title,
  description,
  retryLabel,
  onRetry,
}: RoomErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <section className="space-y-4 text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" onClick={onRetry}>
          {retryLabel}
        </Button>
      </section>
    </main>
  )
}
