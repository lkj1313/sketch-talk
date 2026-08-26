import type { GetRoomsQuery } from '@sketch-talk/contracts'

export const roomQueryKeys = {
  all: ['rooms'] as const,
  list: (query: GetRoomsQuery) => ['rooms', 'list', query] as const,
  detail: (code: string) => ['rooms', 'detail', code] as const,
  currentParticipant: (code: string) =>
    ['rooms', 'detail', code, 'current-participant'] as const,
}
