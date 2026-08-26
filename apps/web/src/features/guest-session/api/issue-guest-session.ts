import type {
  ApiSuccessResponse,
  GuestSessionResponse,
} from '@sketch-talk/contracts'

import { httpClient } from '@/shared/api'

export async function issueGuestSession(): Promise<GuestSessionResponse> {
  const response = await httpClient.post<
    ApiSuccessResponse<GuestSessionResponse>
  >('/guest-sessions')

  return response.data.data
}
