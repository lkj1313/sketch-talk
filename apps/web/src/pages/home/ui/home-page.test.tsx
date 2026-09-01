import type { AuthUser } from "@sketch-talk/contracts";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { useSessionStore } from "@/entities/session";

import { HomePage } from "./home-page";

const user: AuthUser = {
  id: "user-id",
  email: "test@example.com",
  nickname: "테스터",
  avatarUrl: null,
  createdAt: "2026-09-01T00:00:00.000Z",
};

function renderHome(): void {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  afterEach(() => {
    useSessionStore.getState().clearSession();
  });

  it("게임 소개와 시작 링크를 표시한다", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: "Sketch Talk" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "지금 게임 시작하기" }),
    ).toHaveAttribute("href", "/lobby");
    expect(
      screen.getByRole("link", { name: "기록을 남기려면 회원가입" }),
    ).toHaveAttribute("href", "/signup");
  });

  it("로그인한 회원에게 내 기록 링크를 표시한다", () => {
    useSessionStore.getState().setSession("access-token", user);

    renderHome();

    expect(screen.getByRole("link", { name: "내 기록" })).toHaveAttribute(
      "href",
      "/me",
    );
    expect(
      screen.queryByRole("link", { name: "기록을 남기려면 회원가입" }),
    ).not.toBeInTheDocument();
  });
});
