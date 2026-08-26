import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  LoginRequest,
  LoginResponse,
} from '@sketch-talk/contracts'
import axios from 'axios'

import { httpClient } from '@/shared/api'

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await httpClient.post<ApiSuccessResponse<LoginResponse>>(
    '/auth/login',
    request,
  )

  return response.data.data
}

export function getLoginErrorMessage(error: Error): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? '로그인에 실패했습니다.'
  }

  return '로그인에 실패했습니다.'
}
