import { randomUUID } from "node:crypto";

import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import {
  cleanupAuthTestData,
  cleanupRoomTestData,
  createGameTestWords,
} from "./support/database";

const GUEST_TOKEN_COOKIE_NAME = "guestToken";
const API_COOKIE_URL = "http://localhost:3000/api/v1";

async function getGuestToken(
  context: BrowserContext,
): Promise<string | undefined> {
  const cookies = await context.cookies(API_COOKIE_URL);

  return cookies.find((cookie) => cookie.name === GUEST_TOKEN_COOKIE_NAME)
    ?.value;
}

async function drawLine(page: Page): Promise<void> {
  const canvas = page.getByLabel("게임 그림판");

  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();

  if (!bounds) {
    throw new Error("그림판의 위치를 찾을 수 없습니다.");
  }

  await page.mouse.move(
    bounds.x + bounds.width * 0.2,
    bounds.y + bounds.height * 0.3,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.5,
    bounds.y + bounds.height * 0.5,
    {
      steps: 8,
    },
  );
  await page.mouse.move(
    bounds.x + bounds.width * 0.8,
    bounds.y + bounds.height * 0.7,
    {
      steps: 8,
    },
  );
  await page.mouse.up();
}

async function canvasHasDrawing(page: Page): Promise<boolean> {
  return page
    .getByLabel("게임 그림판")
    .evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext("2d");

      if (!context) {
        return false;
      }

      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;

      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] !== 0) {
          return true;
        }
      }

      return false;
    });
}

async function getAssignedWord(page: Page): Promise<string> {
  const word = await page
    .getByText("제시어", { exact: true })
    .locator("..")
    .locator("p")
    .nth(1)
    .textContent();

  if (!word?.trim()) {
    throw new Error("출제자에게 전달된 제시어를 찾을 수 없습니다.");
  }

  return word.trim();
}

async function sendChatMessage(page: Page, message: string): Promise<void> {
  await page.getByRole("textbox", { name: "채팅 메시지" }).fill(message);
  await page.getByRole("button", { name: "메시지 전송" }).click();
}

test("회원과 비회원이 게임을 완료하고 회원 기록을 확인한다", async ({
  browser,
}) => {
  const hostContext = await browser.newContext();
  const participantContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const participantPage = await participantContext.newPage();
  const identifier = randomUUID().slice(0, 10);
  const hostEmail = `playwright-room-${identifier}@example.com`;
  const hostPassword = "Playwright1234!";
  const hostNickname = `Playwright방장-${identifier}`;
  const participantNickname = "Playwright참가자";
  const roomTitle = "Playwright 게임방";
  let wordIds: string[] = [];
  let roomCode: string | undefined;
  let hostGuestToken: string | undefined;
  let participantGuestToken: string | undefined;

  try {
    wordIds = await createGameTestWords();

    await hostPage.goto("/signup");
    await hostPage.getByLabel("이메일").fill(hostEmail);
    await hostPage.getByLabel("비밀번호").fill(hostPassword);
    await hostPage.getByLabel("닉네임").fill(hostNickname);
    await hostPage.getByRole("button", { name: "회원가입" }).click();
    await expect(hostPage).toHaveURL(/\/login$/);
    await hostPage.getByLabel("이메일").fill(hostEmail);
    await hostPage.getByLabel("비밀번호").fill(hostPassword);
    await hostPage.getByRole("button", { name: "로그인" }).click();
    await expect(hostPage).toHaveURL(/\/lobby$/);

    await expect(
      hostPage.getByRole("heading", { name: "방 목록" }),
    ).toBeVisible();
    await hostPage.getByRole("button", { name: "방 만들기" }).click();
    await hostPage.getByLabel("방 제목").fill(roomTitle);
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

    await drawLine(hostPage);

    await expect.poll(() => canvasHasDrawing(participantPage)).toBe(true);

    const ordinaryMessage = "Playwright 일반 채팅";
    await sendChatMessage(participantPage, ordinaryMessage);
    await expect(
      hostPage.getByText(ordinaryMessage, { exact: true }),
    ).toBeVisible();

    const firstAnswer = await getAssignedWord(hostPage);
    await sendChatMessage(participantPage, firstAnswer);

    await expect(hostPage.getByText("2 / 2", { exact: true })).toBeVisible();
    await expect(
      participantPage.getByText("2 / 2", { exact: true }),
    ).toBeVisible();
    await expect(
      participantPage.getByText("제시어", { exact: true }),
    ).toBeVisible();
    await expect(hostPage.getByText("관전 중")).toBeVisible();

    const secondAnswer = await getAssignedWord(participantPage);
    await sendChatMessage(hostPage, secondAnswer);

    await expect(
      hostPage.getByRole("heading", { name: "게임 종료" }),
    ).toBeVisible();
    await expect(
      participantPage.getByRole("heading", { name: "게임 종료" }),
    ).toBeVisible();
    await expect(
      hostPage.getByRole("list", { name: "최종 순위" }),
    ).toContainText(hostNickname);
    await expect(
      hostPage.getByRole("list", { name: "최종 순위" }),
    ).toContainText(participantNickname);
    await expect(
      participantPage.getByRole("link", { name: "로비로 이동" }),
    ).toBeVisible();

    await hostPage.getByRole("link", { name: "로비로 이동" }).click();
    await hostPage.getByRole("link", { name: "내 기록" }).click();

    await expect(hostPage).toHaveURL(/\/me$/);
    await expect(hostPage.getByText(roomTitle)).toBeVisible();
    await expect(
      hostPage.getByText("플레이").locator("..").getByText("1회"),
    ).toBeVisible();
  } finally {
    hostGuestToken = await getGuestToken(hostContext);
    participantGuestToken = await getGuestToken(participantContext);
    await Promise.all([hostContext.close(), participantContext.close()]);
    await cleanupRoomTestData({
      roomCode,
      guestTokens: [hostGuestToken, participantGuestToken],
      wordIds,
    });
    await cleanupAuthTestData(hostEmail);
  }
});
