import type { ChatMessage } from '../model/chat-message.type'

import { cn } from '@/shared/lib'

export type ChatMessageItemProps = {
  message: ChatMessage
  isMine: boolean
}

export function ChatMessageItem({
  message,
  isMine,
}: ChatMessageItemProps) {
  return (
    <li className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex min-w-0 max-w-[85%] flex-col',
          isMine ? 'items-end' : 'items-start',
        )}
      >
        <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
          {isMine ? '나' : message.participant.nickname}
        </p>
        <div
          className={cn(
            'rounded-2xl px-3 py-2',
            isMine
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-muted text-foreground',
          )}
        >
          <p className="break-words whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
            {message.message}
          </p>
        </div>
        <time
          dateTime={message.sentAt}
          className="mt-1 px-1 text-[11px] text-muted-foreground"
        >
          {formatChatTime(message.sentAt)}
        </time>
      </div>
    </li>
  )
}

function formatChatTime(sentAt: string): string {
  const date = new Date(sentAt)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
