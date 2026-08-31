import type { GameReconnectState } from '@sketch-talk/contracts'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { GameScreen } from './game-screen'

const gameState: GameReconnectState = {
  gameSessionId: 'preview-game-id',
  roundId: 'preview-round-id',
  roundNumber: 1,
  totalRounds: 6,
  drawer: {
    id: 'preview-drawer-id',
    nickname: '그림왕',
  },
  difficulty: 'EASY',
  startedAt: '2026-08-27T00:00:00.000Z',
  expiresAt: '2026-08-27T00:02:00.000Z',
}

const meta = {
  title: '게임/GameScreen',
  component: GameScreen,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <Story />
        </div>
      </main>
    ),
  ],
  args: {
    roomCode: 'ABC234',
    gameState,
    assignedWord: null,
    correctAnswer: null,
    roundTimedOut: null,
    roundSkipped: null,
    isConnected: true,
    remainingSeconds: 120,
  },
} satisfies Meta<typeof GameScreen>

export default meta

type Story = StoryObj<typeof meta>

export const 참가자화면: Story = {}

export const 출제자화면: Story = {
  args: {
    assignedWord: '사과',
  },
}

export const 정답발생: Story = {
  args: {
    correctAnswer: {
      gameSessionId: 'preview-game-id',
      roundId: 'preview-round-id',
      answer: '사과',
      guesser: {
        id: 'preview-guesser-id',
        nickname: '정답왕',
        awardedScore: 100,
      },
      drawer: {
        id: 'preview-drawer-id',
        nickname: '그림왕',
        awardedScore: 50,
      },
    },
  },
}

export const 시간초과: Story = {
  args: {
    roundTimedOut: {
      gameSessionId: 'preview-game-id',
      roundId: 'preview-round-id',
      answer: '사과',
    },
    remainingSeconds: 0,
  },
}

export const 출제자퇴장: Story = {
  args: {
    roundSkipped: {
      gameSessionId: 'preview-game-id',
      roundId: 'preview-round-id',
      answer: '사과',
      reason: 'DRAWER_LEFT',
    },
  },
}

export const 참가자부족: Story = {
  args: {
    roundSkipped: {
      gameSessionId: 'preview-game-id',
      roundId: 'preview-round-id',
      answer: '사과',
      reason: 'NOT_ENOUGH_PARTICIPANTS',
    },
  },
}

export const 연결중: Story = {
  args: {
    isConnected: false,
  },
}

export const 상태불러오는중: Story = {
  args: {
    gameState: null,
    isConnected: false,
  },
}

export const 어려운제시어: Story = {
  args: {
    gameState: {
      ...gameState,
      roundNumber: 4,
      difficulty: 'HARD',
    },
    assignedWord: '롤러코스터',
    remainingSeconds: 37,
  },
}
