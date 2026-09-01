import { CopyIcon } from "lucide-react";

import { Button } from "@/shared/ui";

import { useCopyRoomInvite } from "../model/use-copy-room-invite";

export type CopyRoomInviteButtonProps = {
  code: string;
};

export function CopyRoomInviteButton({ code }: CopyRoomInviteButtonProps) {
  const { copyRoomInvite } = useCopyRoomInvite(code);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      aria-label="초대 링크 복사"
      onClick={() => void copyRoomInvite()}
    >
      <CopyIcon aria-hidden="true" />
      초대
    </Button>
  );
}
