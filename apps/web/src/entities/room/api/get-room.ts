import type {
  ApiSuccessResponse,
  RoomDetailResponse,
  RoomParticipantResponse,
} from '@sketch-talk/contracts'

import { httpClient } from '@/shared/api'

export async function getRoom(code: string): Promise<RoomDetailResponse> {
  const response = await httpClient.get<
    ApiSuccessResponse<RoomDetailResponse>
  >(`/rooms/${code}`)

  return response.data.data
}

export async function getCurrentRoomParticipant(
  code: string,
): Promise<RoomParticipantResponse | null> {
  const response = await httpClient.get<
    ApiSuccessResponse<RoomParticipantResponse | null>
  >(`/rooms/${code}/participants/me`)

  return response.data.data
}
