import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  SignupRequest,
  SignupResponse,
} from '@sketch-talk/contracts'
import axios from 'axios'

import { httpClient } from '@/shared/api'

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  const response = await httpClient.post<ApiSuccessResponse<SignupResponse>>(
    '/auth/signup',
    request,
  )

  return response.data.data
}

export function getSignupErrorMessage(error: Error | null): string | null {
  if (!error) {
    return null
  }

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? '회원가입에 실패했습니다.'
  }

  return '회원가입에 실패했습니다.'
}
