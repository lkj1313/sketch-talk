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
} satisfies Meta<typeof DrawingBoard>

export default meta

type Story = StoryObj<typeof meta>

export const 기본: Story = {}
