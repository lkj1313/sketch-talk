import type { GameFinishedEvent } from '@sketch-talk/contracts'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'

import { GameResultScreen } from './game-result-screen'

const result = {
  gameSessionId: 'preview-game-id',
  scores: [
    { participantId: 'participant-1', nickname: '그림왕', score: 500 },
    { participantId: 'participant-2', nickname: '연필장인', score: 350 },
    { participantId: 'participant-3', nickname: '지우개왕', score: 200 },
    { participantId: 'participant-4', nickname: '현재 사용자', score: 100 },
  ],
  endedAt: '2026-08-31T10:10:00.000Z',
} satisfies GameFinishedEvent

const meta = {
  title: '게임/GameResultScreen',
  component: GameResultScreen,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    result,
    currentParticipantId: 'participant-4',
  },
} satisfies Meta<typeof GameResultScreen>

export default meta

type Story = StoryObj<typeof meta>

export const 정상종료: Story = {}

export const 참가자부족종료: Story = {
  args: {
    result: {
      ...result,
      reason: 'NOT_ENOUGH_PARTICIPANTS',
    },
  },
}
