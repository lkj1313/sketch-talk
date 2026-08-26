import { Navigate, Outlet } from 'react-router-dom'

import { useSessionStore } from '@/entities/session'

export function GuestOnlyRoute() {
  const user = useSessionStore((state) => state.user)

  if (user) {
    return <Navigate to="/lobby" replace />
  }

  return <Outlet />
}
