import { useEffect, useRef } from 'react'

export function useMessageListAutoScroll(messageCount: number) {
  const messageListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const messageList = messageListRef.current

    if (!messageList) {
      return
    }

    messageList.scrollTop = messageList.scrollHeight
  }, [messageCount])

  return messageListRef
}
