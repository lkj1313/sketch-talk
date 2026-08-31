import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session'
import { LogoutButton } from '@/features/auth-logout'
import { CreateRoomDialog } from '@/features/room-create'
import { Button } from '@/shared/ui'
import { RoomList } from '@/widgets/room-list'

export function LobbyPage() {
  const navigate = useNavigate()
  const accessToken = useSessionStore((state) => state.accessToken)

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">방 목록</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              참여할 방을 선택해 그림 게임을 시작해보세요.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateRoomDialog />
            {accessToken ? (
              <LogoutButton />
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate('/login')}
              >
                로그인
              </Button>
            )}
          </div>
        </header>

        <div className="mt-8">
          <RoomList />
        </div>
      </div>
    </main>
  )
}
