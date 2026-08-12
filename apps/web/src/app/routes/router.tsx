import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { GamePage } from '@/pages/game'
import { HomePage } from '@/pages/home'
import { LobbyPage } from '@/pages/lobby'
import { LoginPage } from '@/pages/login'
import { RoomPage } from '@/pages/room'
import { SignupPage } from '@/pages/signup'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/lobby',
    element: <LobbyPage />,
  },
  {
    path: '/rooms/:roomCode',
    element: <RoomPage />,
  },
  {
    path: '/games/:gameId',
    element: <GamePage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
