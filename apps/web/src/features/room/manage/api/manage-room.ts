import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  RoomDetailResponse,
  RoomParticipantResponse,
  UpdateReadyRequest,
} from '@sketch-talk/contracts'
import axios from 'axios'

import { httpClient } from '@/shared/api'

export async function updateReady(
  code: string,
  request: UpdateReadyRequest,
): Promise<RoomParticipantResponse> {
  const response = await httpClient.patch<
    ApiSuccessResponse<RoomParticipantResponse>
  >(`/rooms/${code}/participants/me/ready`, request)

  return response.data.data
}

export async function leaveRoom(code: string): Promise<void> {
  await httpClient.delete<ApiSuccessResponse<null>>(
    `/rooms/${code}/participants/me`,
  )
}

export async function startRoom(code: string): Promise<RoomDetailResponse> {
  const response = await httpClient.post<
    ApiSuccessResponse<RoomDetailResponse>
  >(`/rooms/${code}/start`)

  return response.data.data
}

export function getRoomActionErrorMessage(
  error: Error,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? fallbackMessage
  }

  return fallbackMessage
}
