import { expect, test, type BrowserContext } from "@playwright/test";

import { cleanupRoomTestData, createGameTestWords } from "./support/database";

const GUEST_TOKEN_COOKIE_NAME = "guestToken";
const API_COOKIE_URL = "http://localhost:3000/api/v1";

async function getGuestToken(
  context: BrowserContext,
): Promise<string | undefined> {
  const cookies = await context.cookies(API_COOKIE_URL);

  return cookies.find((cookie) => cookie.name === GUEST_TOKEN_COOKIE_NAME)
    ?.value;
}

test("두 명의 비회원이 방에 참가하고 게임을 시작한다", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const participantContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const participantPage = await participantContext.newPage();
  const hostNickname = "Playwright방장";
  const participantNickname = "Playwright참가자";
  const roomTitle = "Playwright 게임방";
  let wordIds: string[] = [];
  let roomCode: string | undefined;
  let hostGuestToken: string | undefined;
  let participantGuestToken: string | undefined;

  try {
    wordIds = await createGameTestWords();
    await hostPage.goto("/lobby");
    await expect(
      hostPage.getByRole("heading", { name: "방 목록" }),
    ).toBeVisible();
    await hostPage.getByRole("button", { name: "방 만들기" }).click();
    await hostPage.getByLabel("방 제목").fill(roomTitle);
    await hostPage.getByLabel("닉네임").fill(hostNickname);
    await hostPage.getByLabel("최대 인원").selectOption("2");
    await hostPage.getByRole("button", { name: "방 만들기" }).last().click();

    await expect(hostPage).toHaveURL(/\/rooms\/[A-Z0-9]{6}$/);
    roomCode = new URL(hostPage.url()).pathname.split("/").at(-1);
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
    await expect(
      hostPage.getByRole("heading", { name: roomTitle }),
    ).toBeVisible();
    await expect(
      hostPage.getByRole("button", { name: "게임 시작" }),
    ).toBeVisible();

    await participantPage.goto(`/rooms/${roomCode}`);
    await expect(
      participantPage.getByRole("heading", {
        name: "방에 참가하시겠습니까?",
      }),
    ).toBeVisible();
    await participantPage.getByLabel("닉네임").fill(participantNickname);
    await participantPage.getByRole("button", { name: "참가하기" }).click();

    await expect(
      participantPage.getByRole("button", { name: "준비하기" }),
    ).toBeVisible();
    await expect(hostPage.getByText(participantNickname)).toBeVisible();

    await participantPage.getByRole("button", { name: "준비하기" }).click();

    await expect(
      participantPage.getByRole("button", { name: "준비 취소" }),
    ).toBeVisible();
    await expect(hostPage.getByText("준비 완료")).toBeVisible();

    await hostPage.getByRole("button", { name: "게임 시작" }).click();

    const gameUrlPattern = new RegExp(
      `/rooms/${roomCode}/games/[0-9a-f-]{36}$`,
      "i",
    );
    await expect(hostPage).toHaveURL(gameUrlPattern);
    await expect(participantPage).toHaveURL(gameUrlPattern);
    await expect(hostPage.getByRole("heading", { name: "게임" })).toBeVisible();
    await expect(
      participantPage.getByRole("heading", { name: "게임" }),
    ).toBeVisible();
    await expect(hostPage.getByText("실시간 연결됨")).toBeVisible();
    await expect(participantPage.getByText("실시간 연결됨")).toBeVisible();
    await expect(hostPage.getByText("제시어", { exact: true })).toBeVisible();
    await expect(participantPage.getByText("관전 중")).toBeVisible();
  } finally {
    hostGuestToken = await getGuestToken(hostContext);
    participantGuestToken = await getGuestToken(participantContext);
    await Promise.all([hostContext.close(), participantContext.close()]);
    await cleanupRoomTestData({
      roomCode,
      guestTokens: [hostGuestToken, participantGuestToken],
      wordIds,
    });
  }
});
