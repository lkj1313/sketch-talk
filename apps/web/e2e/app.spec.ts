import { expect, test, type Page } from "@playwright/test";

async function mockGuestSession(page: Page): Promise<void> {
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        statusCode: 401,
        error: {
          code: "AUTH_REFRESH_TOKEN_REQUIRED",
          message: "Refresh Token이 필요합니다.",
        },
      }),
    });
  });
  await page.route("**/api/v1/guest-sessions", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        statusCode: 201,
        data: {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
        },
      }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockGuestSession(page);
});

test("홈 화면을 표시한다", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Sketch Talk" }),
  ).toBeVisible();
});

test("로그인 화면에서 입력 필드를 사용할 수 있다", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await page.getByLabel("이메일").fill("test@example.com");
  await page.getByLabel("비밀번호").fill("password123");

  await expect(page.getByLabel("이메일")).toHaveValue("test@example.com");
  await expect(page.getByLabel("비밀번호")).toHaveValue("password123");
  await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
});
