import { sendGameMessage } from '@/features/game-chat-send'
import { DrawingBoard } from '@/widgets/drawing-board'
import { GameChat } from '@/widgets/game-chat'
import { GameResultScreen } from '@/widgets/game-result'
import { GameScreen } from '@/widgets/game-screen'

import { useGamePage } from '../model/use-game-page'

export function GamePage() {
  const {
    assignedWord,
    correctAnswer,
    currentParticipantId,
    drawingStrokes,
    gameResult,
    gameState,
    isChatDisabled,
    isConnected,
    isDrawer,
    messages,
    remainingSeconds,
    roomCode,
    roundSkipped,
    roundTimedOut,
    sendDrawingClear,
    sendDrawingStroke,
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
        <div className="grid min-w-0 gap-4">
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
          {gameState && (
            <DrawingBoard
              canDraw={isDrawer && isConnected}
              roundId={gameState.roundId}
              strokes={drawingStrokes}
              onClear={() => sendDrawingClear(gameState.roundId)}
              onStrokeComplete={sendDrawingStroke}
            />
          )}
        </div>
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
