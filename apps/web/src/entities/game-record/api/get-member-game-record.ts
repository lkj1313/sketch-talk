import type {
  ApiSuccessResponse,
  MemberGameRecordResponse,
} from "@sketch-talk/contracts";

import { httpClient } from "@/shared/api";

export async function getMemberGameRecord(): Promise<MemberGameRecordResponse> {
  const response = await httpClient.get<
    ApiSuccessResponse<MemberGameRecordResponse>
  >("/users/me/game-records");

  return response.data.data;
}
