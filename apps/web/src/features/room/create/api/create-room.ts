import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  CreateRoomRequest,
  RoomResponse,
} from '@sketch-talk/contracts'
import axios from 'axios'

import { httpClient } from '@/shared/api'

export async function createRoom(
  request: CreateRoomRequest,
): Promise<RoomResponse> {
  const response = await httpClient.post<ApiSuccessResponse<RoomResponse>>(
    '/rooms',
    request,
  )

  return response.data.data
}

export function getCreateRoomErrorMessage(error: Error): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? '방을 만들지 못했습니다.'
  }

  return '방을 만들지 못했습니다.'
}
