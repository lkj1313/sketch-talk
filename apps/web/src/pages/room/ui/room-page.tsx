import { Button, Spinner } from '@/shared/ui'
import { RoomDetails } from '@/widgets/room-details'

import { useRoomPage } from '../model/use-room-page'

export function RoomPage() {
  const roomPage = useRoomPage()

  if (roomPage.status === 'invalid') {
    return (
      <RoomErrorState
        title="올바르지 않은 방 코드입니다."
        description="6자리 초대 코드를 다시 확인해주세요."
        onRetry={roomPage.goToLobby}
        retryLabel="로비로 이동"
      />
    )
  }

  if (roomPage.status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <Spinner className="size-8" aria-label="방 정보 불러오는 중" />
      </main>
    )
  }

  if (roomPage.status === 'error') {
    return (
      <RoomErrorState
        title="방 정보를 불러오지 못했습니다."
        description="방이 존재하는지 확인한 후 다시 시도해주세요."
        onRetry={roomPage.retry}
        retryLabel="다시 시도"
      />
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <RoomDetails
        room={roomPage.room}
        currentParticipant={roomPage.currentParticipant}
        onBack={roomPage.goToLobby}
      />
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
