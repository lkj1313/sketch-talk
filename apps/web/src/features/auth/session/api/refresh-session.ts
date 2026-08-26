import type {
  ApiSuccessResponse,
  RefreshResponse,
} from '@sketch-talk/contracts'

import { httpClient } from '@/shared/api'

export async function refreshSession(): Promise<RefreshResponse> {
  const response = await httpClient.post<ApiSuccessResponse<RefreshResponse>>(
    '/auth/refresh',
  )

  return response.data.data
}
