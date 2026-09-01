import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GameScreen, type GameScreenProps } from "./game-screen";

const defaultProps: GameScreenProps = {
  roomCode: "ABC234",
  gameState: null,
  assignedWord: null,
  correctAnswer: null,
  roundTimedOut: null,
  roundSkipped: null,
  isConnected: true,
  remainingSeconds: 0,
};

describe("GameScreen", () => {
  it("소켓 연결이 끊기면 자동 재연결 상태를 안내한다", () => {
    render(<GameScreen {...defaultProps} isConnected={false} />);

    expect(
      screen.getByRole("status", { name: "실시간 연결 상태" }),
    ).toHaveTextContent(
      "실시간 연결이 끊어졌습니다.",
    );
    expect(
      screen.getByRole("status", { name: "실시간 연결 상태" }),
    ).toHaveTextContent(
      "자동으로 다시 연결하고 있습니다.",
    );
  });

  it("소켓이 연결되어 있으면 재연결 안내를 표시하지 않는다", () => {
    render(<GameScreen {...defaultProps} />);

    expect(
      screen.queryByRole("status", { name: "실시간 연결 상태" }),
    ).not.toBeInTheDocument();
  });
});
