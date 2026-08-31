import { useParams } from 'react-router-dom'

import { useGameRealtime } from '@/features/game-realtime'
import { GameScreen } from '@/widgets/game-screen'

import { useRoundCountdown } from '../model/use-round-countdown'

export function GamePage() {
  const { roomCode = '', gameId = '' } = useParams()
  const normalizedRoomCode = roomCode.trim().toUpperCase()
  const { gameState, assignedWord, isConnected } = useGameRealtime({
    roomCode: normalizedRoomCode,
    gameId,
  })
  const remainingSeconds = useRoundCountdown(gameState?.expiresAt)

  return (
    <GameScreen
      roomCode={normalizedRoomCode}
      gameState={gameState}
      assignedWord={assignedWord}
      isConnected={isConnected}
      remainingSeconds={remainingSeconds}
    />
  )
}
