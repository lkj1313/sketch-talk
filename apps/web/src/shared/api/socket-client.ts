import { io } from 'socket.io-client'

import { env } from '@/shared/config'

export const roomSocket = io(`${env.socketUrl}/rooms`, {
  path: '/api/v1/socket.io',
  withCredentials: true,
  autoConnect: false,
})

export function connectRoomSocket(accessToken?: string): void {
  roomSocket.auth = accessToken ? { accessToken } : {}
  roomSocket.connect()
}

export function disconnectRoomSocket(): void {
  roomSocket.disconnect()
}
