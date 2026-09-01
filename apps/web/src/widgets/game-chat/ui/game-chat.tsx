import { MessageCircleIcon } from 'lucide-react'
import { useId } from 'react'

import {
  ChatMessageItem,
  type ChatMessage,
} from '@/entities/chat-message'
import { GameChatInput } from '@/features/game-chat-send'
import { cn } from '@/shared/lib/cn'

import { useMessageListAutoScroll } from '../model/use-message-list-auto-scroll'

export type GameChatProps = {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  currentParticipantId?: string
  disabled?: boolean
  className?: string
}

export function GameChat({
  messages,
  onSendMessage,
  currentParticipantId,
  disabled = false,
  className,
}: GameChatProps) {
  const titleId = useId()
  const messageListRef = useMessageListAutoScroll(messages.length)

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'flex min-h-96 w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm',
        className,
      )}
    >
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <MessageCircleIcon aria-hidden="true" className="size-5" />
        <h2 id={titleId} className="font-semibold">
          채팅
        </h2>
      </header>

      <div
        ref={messageListRef}
        aria-live="polite"
        className="flex flex-1 flex-col overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <ul aria-label="채팅 메시지" className="space-y-3">
            {messages.map((chat, index) => {
              const isMine = chat.participant.id === currentParticipantId

              return (
                <ChatMessageItem
                  key={`${chat.participant.id}-${chat.sentAt}-${index}`}
                  message={chat}
                  isMine={isMine}
                />
              )
            })}
          </ul>
        )}
      </div>

      <GameChatInput disabled={disabled} onSendMessage={onSendMessage} />
    </section>
  )
}

function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-10 text-center">
      <MessageCircleIcon
        aria-hidden="true"
        className="size-8 text-muted-foreground/60"
      />
      <p className="text-sm font-medium">아직 채팅 메시지가 없습니다.</p>
      <p className="text-xs text-muted-foreground">
        게임 참가자들과 대화를 시작해보세요.
      </p>
    </div>
  )
}
