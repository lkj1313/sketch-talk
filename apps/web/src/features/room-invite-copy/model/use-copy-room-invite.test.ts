import { describe, expect, it } from "vitest";

import { getRoomInviteUrl } from "./use-copy-room-invite";

describe("getRoomInviteUrl", () => {
  it("현재 서비스 주소와 방 코드로 초대 링크를 만든다", () => {
    expect(getRoomInviteUrl("ABC234", "https://sketch-talk.example")).toBe(
      "https://sketch-talk.example/rooms/ABC234",
    );
  });
});
