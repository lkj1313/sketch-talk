import type {
  AuthUser,
  MemberGameRecordResponse,
} from "@sketch-talk/contracts";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "@/entities/session";

import { ProfilePage } from "./profile-page";

const mocks = vi.hoisted(() => ({
  useMemberGameRecord: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/entities/game-record", () => ({
  useMemberGameRecord: mocks.useMemberGameRecord,
}));

const user: AuthUser = {
  id: "user-id",
  email: "test@example.com",
  nickname: "테스터",
  avatarUrl: null,
  createdAt: "2026-09-01T00:00:00.000Z",
};

const record: MemberGameRecordResponse = {
  stats: {
    gamesPlayed: 3,
    wins: 1,
    totalScore: 450,
    bestScore: 200,
  },
  recentGames: [
    {
      gameSessionId: "game-session-id",
      roomTitle: "즐거운 그림방",
      score: 200,
      rank: 1,
      playerCount: 4,
      endedAt: "2026-09-01T00:10:00.000Z",
    },
  ],
};

function renderProfile(): void {
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.getState().setSession("access-token", user);
    mocks.useMemberGameRecord.mockReturnValue({
      data: record,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
  });

  it("회원 통계와 최근 게임을 표시한다", () => {
    renderProfile();

    expect(
      screen.getByRole("heading", { name: "테스터님" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3회")).toBeInTheDocument();
    expect(screen.getByText("1회")).toBeInTheDocument();
    expect(screen.getByText("450점")).toBeInTheDocument();
    expect(screen.getByText("즐거운 그림방")).toBeInTheDocument();
    expect(screen.getByText("1위 · 200점")).toBeInTheDocument();
  });

  it("게임 기록이 없으면 빈 상태를 표시한다", () => {
    mocks.useMemberGameRecord.mockReturnValue({
      data: { ...record, recentGames: [] },
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });

    renderProfile();

    expect(
      screen.getByText("아직 완료한 게임이 없습니다."),
    ).toBeInTheDocument();
  });
});
