import { useParams } from 'react-router-dom'

import { useCurrentRoomParticipant } from '@/entities/room'
import { sendGameMessage } from '@/features/game-chat-send'
import { useGameRealtime } from '@/features/game-realtime'
import { GameChat } from '@/widgets/game-chat'
import { GameScreen } from '@/widgets/game-screen'

import { useRoundCountdown } from '../model/use-round-countdown'

export function GamePage() {
  const { roomCode = '', gameId = '' } = useParams()
  const normalizedRoomCode = roomCode.trim().toUpperCase()
  const currentParticipantQuery = useCurrentRoomParticipant(normalizedRoomCode)
  const {
    gameState,
    assignedWord,
    correctAnswer,
    messages,
    isConnected,
  } = useGameRealtime({
    roomCode: normalizedRoomCode,
    gameId,
  })
  const remainingSeconds = useRoundCountdown(gameState?.expiresAt)

  const isChatDisabled = !isConnected || !gameState

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <GameScreen
          roomCode={normalizedRoomCode}
          gameState={gameState}
          assignedWord={assignedWord}
          correctAnswer={correctAnswer}
          isConnected={isConnected}
          remainingSeconds={remainingSeconds}
        />
        <GameChat
          className="lg:max-h-[640px]"
          currentParticipantId={currentParticipantQuery.data?.id}
          disabled={isChatDisabled}
          messages={messages}
          onSendMessage={sendGameMessage}
        />
      </div>
    </main>
  )
}
