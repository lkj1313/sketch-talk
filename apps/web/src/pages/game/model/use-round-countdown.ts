import { useEffect, useState } from 'react'

function calculateRemainingSeconds(expiresAt: string | undefined): number {
  if (!expiresAt) {
    return 0
  }

  const expiresAtTime = Date.parse(expiresAt)

  if (Number.isNaN(expiresAtTime)) {
    return 0
  }

  return Math.max(0, Math.ceil((expiresAtTime - Date.now()) / 1_000))
}

export function useRoundCountdown(expiresAt?: string): number {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(expiresAt),
  )

  useEffect(() => {
    function updateRemainingSeconds(): void {
      setRemainingSeconds(calculateRemainingSeconds(expiresAt))
    }

    updateRemainingSeconds()
    const intervalId = window.setInterval(updateRemainingSeconds, 1_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [expiresAt])

  return remainingSeconds
}
