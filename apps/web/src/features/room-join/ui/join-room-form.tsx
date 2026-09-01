import { Button, Input, Label } from '@/shared/ui'

import { useJoinRoomForm } from '../model/use-join-room-form'

type JoinRoomFormProps = {
  code: string
}

export function JoinRoomForm({ code }: JoinRoomFormProps) {
  const { errors, isGuest, isPending, register, submit } =
    useJoinRoomForm(code)

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">방에 참가하시겠습니까?</h2>
        <p className="text-sm text-muted-foreground">
          참가하면 대기실에서 다른 참가자들과 게임을 준비할 수 있습니다.
        </p>
      </div>

      <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
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
          disabled={isPending}
        >
          {isPending ? '참가하는 중...' : '참가하기'}
        </Button>
      </form>
    </section>
  )
}
