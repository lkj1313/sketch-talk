import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { useSessionStore } from '@/entities/session'
import { Button, Input, Label, toast } from '@/shared/ui'

import { getJoinRoomErrorMessage } from '../api/join-room'
import {
  getJoinRoomSchema,
  type JoinRoomFormValues,
} from '../model/join-room-schema'
import { useJoinRoom } from '../model/use-join-room'

type JoinRoomFormProps = {
  code: string
}

export function JoinRoomForm({ code }: JoinRoomFormProps) {
  const accessToken = useSessionStore((state) => state.accessToken)
  const isGuest = !accessToken
  const joinRoomMutation = useJoinRoom(code)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinRoomFormValues>({
    resolver: zodResolver(getJoinRoomSchema(isGuest)),
    defaultValues: { nickname: '' },
  })

  function onSubmit(values: JoinRoomFormValues): void {
    joinRoomMutation.mutate(
      isGuest ? { nickname: values.nickname } : {},
      {
        onSuccess: () => {
          toast.add({
            title: '방에 참가했습니다.',
            type: 'success',
          })
        },
        onError: (error) => {
          toast.add({
            title: '방에 참가하지 못했습니다.',
            description: getJoinRoomErrorMessage(error),
            type: 'error',
          })
        },
      },
    )
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">방에 참가하시겠습니까?</h2>
        <p className="text-sm text-muted-foreground">
          참가하면 대기실에서 다른 참가자들과 게임을 준비할 수 있습니다.
        </p>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {isGuest && (
          <div className="space-y-2">
            <Label htmlFor="join-nickname">닉네임</Label>
            <Input
              id="join-nickname"
              placeholder="방에서 사용할 닉네임"
              aria-invalid={Boolean(errors.nickname)}
              {...register('nickname')}
            />
            {errors.nickname?.message && (
              <p className="text-sm text-destructive">
                {errors.nickname.message}
              </p>
            )}
          </div>
        )}

        <Button
          className="w-full"
          type="submit"
          disabled={joinRoomMutation.isPending}
        >
          {joinRoomMutation.isPending ? '참가하는 중...' : '참가하기'}
        </Button>
      </form>
    </section>
  )
}
