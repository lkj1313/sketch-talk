import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  JoinRoomRequest,
  JoinRoomResponse,
} from '@sketch-talk/contracts'
import axios from 'axios'

import { httpClient } from '@/shared/api'

export async function joinRoom(
  code: string,
  request: JoinRoomRequest,
): Promise<JoinRoomResponse> {
  const response = await httpClient.post<ApiSuccessResponse<JoinRoomResponse>>(
    `/rooms/${code}/participants`,
    request,
  )

  return response.data.data
}

export function getJoinRoomErrorMessage(error: Error): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? '방에 참가하지 못했습니다.'
  }

  return '방에 참가하지 못했습니다.'
}
