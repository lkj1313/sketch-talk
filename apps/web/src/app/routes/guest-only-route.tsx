import { Navigate, Outlet } from 'react-router-dom'

import { useGuestOnlyRoute } from './model/use-guest-only-route'

export function GuestOnlyRoute() {
  const { isAuthenticated } = useGuestOnlyRoute()

  if (isAuthenticated) {
    return <Navigate to="/lobby" replace />
  }

  return <Outlet />
}
