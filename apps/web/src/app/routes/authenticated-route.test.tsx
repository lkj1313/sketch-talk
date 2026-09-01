import type { AuthUser } from "@sketch-talk/contracts";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { useSessionStore } from "@/entities/session";

import { AuthenticatedRoute } from "./authenticated-route";

const user: AuthUser = {
  id: "user-id",
  email: "test@example.com",
  nickname: "테스터",
  avatarUrl: null,
  createdAt: "2026-09-01T00:00:00.000Z",
};

function renderRoute(): void {
  render(
    <MemoryRouter initialEntries={["/me"]}>
      <Routes>
        <Route element={<AuthenticatedRoute />}>
          <Route path="/me" element={<h1>내 기록 페이지</h1>} />
        </Route>
        <Route path="/login" element={<h1>로그인 페이지</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AuthenticatedRoute", () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  it("비로그인 사용자를 로그인 화면으로 이동시킨다", async () => {
    renderRoute();

    expect(
      await screen.findByRole("heading", { name: "로그인 페이지" }),
    ).toBeInTheDocument();
  });

  it("로그인 사용자는 회원 전용 화면에 접근할 수 있다", () => {
    useSessionStore.getState().setSession("access-token", user);

    renderRoute();

    expect(
      screen.getByRole("heading", { name: "내 기록 페이지" }),
    ).toBeInTheDocument();
  });
});
