import type { Meta, StoryObj } from '@storybook/react-vite'

import { DrawingBoard } from './drawing-board'

const meta = {
  title: '게임/DrawingBoard',
  component: DrawingBoard,
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
    roundId: 'preview-round-id',
    canDraw: true,
    strokes: [],
  },
} satisfies Meta<typeof DrawingBoard>

export default meta

type Story = StoryObj<typeof meta>

export const 기본: Story = {}

export const 참가자화면: Story = {
  args: {
    canDraw: false,
    strokes: [
      {
        roundId: 'preview-round-id',
        strokeId: 'preview-stroke-id',
        tool: 'PEN',
        color: '#ef4444',
        width: 8,
        points: [
          { x: 0.2, y: 0.3 },
          { x: 0.4, y: 0.5 },
          { x: 0.7, y: 0.25 },
        ],
      },
    ],
  },
}
