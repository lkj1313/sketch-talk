import type { Meta, StoryObj } from '@storybook/react-vite'

import type { ChatMessage } from '@/entities/chat-message'

import { GameChat } from './game-chat'

const messages = [
  {
    participant: {
      id: 'participant-2',
      nickname: '그림왕',
    },
    message: '안녕하세요! 준비되셨나요?',
    sentAt: '2026-08-31T13:00:00.000Z',
  },
  {
    participant: {
      id: 'participant-1',
      nickname: '나',
    },
    message: '네, 준비됐습니다.',
    sentAt: '2026-08-31T13:01:00.000Z',
  },
  {
    participant: {
      id: 'participant-3',
      nickname: '연필장인',
    },
    message: '이번 문제는 조금 어려워 보이네요.',
    sentAt: '2026-08-31T13:02:00.000Z',
  },
] satisfies ChatMessage[]

const meta = {
  title: '게임/GameChat',
  component: GameChat,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: {
    messages: [],
    currentParticipantId: 'participant-1',
    onSendMessage: () => undefined,
  },
} satisfies Meta<typeof GameChat>

export default meta

type Story = StoryObj<typeof meta>

export const 기본: Story = {}

export const 메시지있음: Story = {
  args: {
    messages,
  },
}

export const 긴메시지: Story = {
  args: {
    messages: [
      ...messages,
      {
        participant: {
          id: 'participant-2',
          nickname: '그림왕',
        },
        message:
          'ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ',
        sentAt: '2026-08-31T13:03:00.000Z',
      },
    ],
  },
}

export const 메시지많음: Story = {
  args: {
    messages: Array.from({ length: 18 }, (_, index) => ({
      participant: {
        id: index % 3 === 0 ? 'participant-1' : `participant-${index + 2}`,
        nickname: index % 3 === 0 ? '나' : `참가자 ${index + 1}`,
      },
      message: `${index + 1}번째 채팅 메시지입니다.`,
      sentAt: new Date(
        Date.UTC(2026, 7, 31, 13, index),
      ).toISOString(),
    })),
  },
}
