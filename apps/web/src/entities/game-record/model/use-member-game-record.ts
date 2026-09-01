import { useQuery } from "@tanstack/react-query";

import { getMemberGameRecord } from "../api/get-member-game-record";

export const memberGameRecordQueryKey = [
  "users",
  "me",
  "game-records",
] as const;

export function useMemberGameRecord() {
  return useQuery({
    queryKey: memberGameRecordQueryKey,
    queryFn: getMemberGameRecord,
  });
}
