import type { ApiSuccessResponse, AuthUser } from '@sketch-talk/contracts'

import { httpClient } from '@/shared/api'

export async function getMe(accessToken: string): Promise<AuthUser> {
  const response = await httpClient.get<ApiSuccessResponse<AuthUser>>(
    '/auth/me',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  return response.data.data
}
