import type { ApiSuccessResponse } from '@sketch-talk/contracts'

import { httpClient } from '@/shared/api'

export async function logout(): Promise<void> {
  await httpClient.post<ApiSuccessResponse<null>>('/auth/logout')
}
