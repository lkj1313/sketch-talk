import type { AuthUser } from "@sketch-talk/contracts";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { useSessionStore } from "@/entities/session";

import { GuestOnlyRoute } from "./guest-only-route";

const user: AuthUser = {
  id: "user-id",
  email: "test@example.com",
  nickname: "테스터",
  avatarUrl: null,
  createdAt: "2026-08-26T00:00:00.000Z",
};

function renderRoute(initialPath: string): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<h1>로그인 페이지</h1>} />
          <Route path="/signup" element={<h1>회원가입 페이지</h1>} />
        </Route>
        <Route path="/lobby" element={<h1>로비 페이지</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GuestOnlyRoute", () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  it.each([
    ["/login", "로그인 페이지"],
    ["/signup", "회원가입 페이지"],
  ])("비로그인 사용자는 %s에 접근할 수 있다", (path, heading) => {
    renderRoute(path);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it.each(["/login", "/signup"])(
    "로그인 사용자가 %s에 접근하면 로비로 이동한다",
    async (path) => {
      useSessionStore.getState().setSession("access-token", user);

      renderRoute(path);

      expect(
        await screen.findByRole("heading", { name: "로비 페이지" }),
      ).toBeInTheDocument();
    },
  );
});
