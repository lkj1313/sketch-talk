import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { cleanupAuthTestData } from "./support/database";

const GUEST_TOKEN_COOKIE_NAME = "guestToken";

test("회원가입 후 로그인하여 로비에 진입한다", async ({ page, context }) => {
  const identifier = randomUUID().slice(0, 12);
  const email = `playwright-${identifier}@example.com`;
  const password = "Playwright1234!";
  const nickname = `테스터-${identifier}`;

  try {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill(password);
    await page.getByLabel("닉네임").fill(nickname);
    await page.getByRole("button", { name: "회원가입" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("회원가입이 완료되었습니다.")).toBeVisible();

    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill(password);
    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page).toHaveURL(/\/lobby$/);
    await expect(page.getByRole("heading", { name: "방 목록" })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();

    await page.getByRole("button", { name: "로그아웃" }).click();

    await expect(page).toHaveURL(/\/login$/);
  } finally {
    const cookies = await context.cookies("http://localhost:3000/api/v1");
    const guestToken = cookies.find(
      (cookie) => cookie.name === GUEST_TOKEN_COOKIE_NAME,
    )?.value;

    await cleanupAuthTestData(email, guestToken);
  }
});
