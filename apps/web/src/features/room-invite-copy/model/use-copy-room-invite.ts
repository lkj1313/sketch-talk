import { toast } from "@/shared/ui";

export function getRoomInviteUrl(code: string, origin: string): string {
  return `${origin}/rooms/${code}`;
}

export function useCopyRoomInvite(code: string) {
  async function copyRoomInvite(): Promise<void> {
    try {
      const inviteUrl = getRoomInviteUrl(code, window.location.origin);

      await navigator.clipboard.writeText(inviteUrl);
      toast.add({
        title: "초대 링크를 복사했습니다.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "초대 링크를 복사하지 못했습니다.",
        description: "브라우저의 클립보드 권한을 확인해주세요.",
        type: "error",
      });
    }
  }

  return { copyRoomInvite };
}
