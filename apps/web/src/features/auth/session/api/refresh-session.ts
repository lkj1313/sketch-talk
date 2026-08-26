import type {
  ApiSuccessResponse,
  RefreshResponse,
} from '@sketch-talk/contracts'

import { refreshClient } from '@/shared/api'

export async function refreshSession(): Promise<RefreshResponse> {
  const response = await refreshClient.post<
    ApiSuccessResponse<RefreshResponse>
  >(
    '/auth/refresh',
  )

  return response.data.data
}
