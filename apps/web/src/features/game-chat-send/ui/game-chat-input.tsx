import { SendIcon } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { Button, Input } from '@/shared/ui'

const GAME_CHAT_MESSAGE_MAX_LENGTH = 100

export type GameChatInputProps = {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function GameChatInput({
  onSendMessage,
  disabled = false,
}: GameChatInputProps) {
  const [message, setMessage] = useState('')
  const trimmedMessage = message.trim()

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (!trimmedMessage || disabled) {
      return
    }

    onSendMessage(trimmedMessage)
    setMessage('')
  }

  return (
    <form
      aria-label="채팅 메시지 전송"
      className="flex gap-2 border-t p-3"
      onSubmit={handleSubmit}
    >
      <Input
        aria-label="채팅 메시지"
        className="h-9"
        disabled={disabled}
        maxLength={GAME_CHAT_MESSAGE_MAX_LENGTH}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="메시지를 입력하세요."
        value={message}
      />
      <Button
        aria-label="메시지 전송"
        disabled={disabled || !trimmedMessage}
        size="icon-lg"
        type="submit"
      >
        <SendIcon aria-hidden="true" />
      </Button>
    </form>
  )
}
