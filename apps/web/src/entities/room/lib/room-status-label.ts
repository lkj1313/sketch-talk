import type { RoomStatus } from '@sketch-talk/contracts'

const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  WAITING: '대기 중',
  PLAYING: '게임 중',
  FINISHED: '종료',
  CLOSED: '닫힘',
}

export function getRoomStatusLabel(status: RoomStatus): string {
  return ROOM_STATUS_LABEL[status]
}
