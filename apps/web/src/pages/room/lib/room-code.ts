const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/

export function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase()
}

export function isValidRoomCode(roomCode: string): boolean {
  return ROOM_CODE_PATTERN.test(roomCode)
}
