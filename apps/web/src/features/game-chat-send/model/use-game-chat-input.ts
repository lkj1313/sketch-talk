import { type FormEvent, useState } from 'react'

type UseGameChatInputOptions = {
  onSendMessage: (message: string) => void
  disabled: boolean
}

export function useGameChatInput({
  onSendMessage,
  disabled,
}: UseGameChatInputOptions) {
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

  return {
    handleSubmit,
    isSubmitDisabled: disabled || !trimmedMessage,
    message,
    setMessage,
  }
}
