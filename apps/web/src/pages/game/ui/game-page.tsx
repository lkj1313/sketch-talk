import { sendGameMessage } from '@/features/game-chat-send'
import { GameChat } from '@/widgets/game-chat'
import { GameResultScreen } from '@/widgets/game-result'
import { GameScreen } from '@/widgets/game-screen'

import { useGamePage } from '../model/use-game-page'

export function GamePage() {
  const {
    assignedWord,
    correctAnswer,
    currentParticipantId,
    gameResult,
    gameState,
    isChatDisabled,
    isConnected,
    messages,
    remainingSeconds,
    roomCode,
    roundSkipped,
    roundTimedOut,
  } = useGamePage()

  if (gameResult) {
    return (
      <GameResultScreen
        currentParticipantId={currentParticipantId}
        result={gameResult}
      />
    )
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <GameScreen
          roomCode={roomCode}
          gameState={gameState}
          assignedWord={assignedWord}
          correctAnswer={correctAnswer}
          roundTimedOut={roundTimedOut}
          roundSkipped={roundSkipped}
          isConnected={isConnected}
          remainingSeconds={remainingSeconds}
        />
        <GameChat
          className="lg:max-h-[640px]"
          currentParticipantId={currentParticipantId}
          disabled={isChatDisabled}
          messages={messages}
          onSendMessage={sendGameMessage}
        />
      </div>
    </main>
  )
}
