import { LogoutButton } from '@/features/auth/logout'

export function LobbyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">방 목록</h1>
        <LogoutButton />
      </header>
    </main>
  )
}
