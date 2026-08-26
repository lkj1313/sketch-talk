import type {
  ApiMeta,
  ApiSuccessResponse,
  GetRoomsQuery,
  RoomResponse,
} from '@sketch-talk/contracts'

import { httpClient } from '@/shared/api'

export type RoomListResult = {
  rooms: RoomResponse[]
  meta: ApiMeta
}

export async function getRooms(query: GetRoomsQuery): Promise<RoomListResult> {
  const response = await httpClient.get<ApiSuccessResponse<RoomResponse[]>>(
    '/rooms',
    { params: query },
  )
  const { data: rooms, meta } = response.data

  if (!meta) {
    throw new Error('방 목록 페이지 정보가 없습니다.')
  }

  return { rooms, meta }
}
