import type { GameMessageRequest } from '@sketch-talk/contracts'

import { ROOM_SOCKET_EVENT, roomSocket } from '@/shared/api'

export function sendGameMessage(message: string): void {
  const request: GameMessageRequest = { message }

  roomSocket.emit(ROOM_SOCKET_EVENT.MESSAGE, request)
}
