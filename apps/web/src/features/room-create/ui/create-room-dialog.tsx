import { Dialog } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'

import { Button, Input, Label } from '@/shared/ui'

import { useCreateRoomDialog } from '../model/use-create-room-dialog'

const selectClassName =
  'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function CreateRoomDialog() {
  const {
    errors,
    handleOpenChange,
    isGuest,
    isPending,
    open,
    register,
    submit,
  } = useCreateRoomDialog()

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger render={<Button type="button" />}>방 만들기</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs" />
        <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
          <Dialog.Popup className="relative w-full max-w-lg rounded-2xl border bg-card p-6 text-card-foreground shadow-xl sm:p-8">
            <Dialog.Title className="text-2xl font-bold tracking-tight">
              새 방 만들기
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              원하는 게임방 설정을 입력해주세요.
            </Dialog.Description>

            <Dialog.Close
              aria-label="방 만들기 닫기"
              className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              disabled={isPending}
            >
              <XIcon aria-hidden="true" className="size-4" />
            </Dialog.Close>

            <form
              className="mt-6 space-y-5"
              onSubmit={submit}
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="room-title">방 제목</Label>
                <Input
                  id="room-title"
                  placeholder="방 제목을 입력해주세요"
                  aria-invalid={Boolean(errors.title)}
                  {...register('title')}
                />
                {errors.title?.message && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {isGuest && (
                <div className="space-y-2">
                  <Label htmlFor="room-nickname">닉네임</Label>
                  <Input
                    id="room-nickname"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="room-visibility">공개 여부</Label>
                  <select
                    id="room-visibility"
                    className={selectClassName}
                    {...register('visibility')}
                  >
                    <option value="PUBLIC">공개방</option>
                    <option value="PRIVATE">비공개방</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room-max-players">최대 인원</Label>
                  <select
                    id="room-max-players"
                    className={selectClassName}
                    {...register('maxPlayers', { valueAsNumber: true })}
                  >
                    {Array.from({ length: 11 }, (_, index) => index + 2).map(
                      (playerCount) => (
                        <option key={playerCount} value={playerCount}>
                          {playerCount}명
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border p-4">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  {...register('allowMidJoin')}
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">중간 참가 허용</span>
                  <span className="block text-xs text-muted-foreground">
                    게임이 시작된 뒤에도 새로운 참가자가 들어올 수 있습니다.
                  </span>
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <Dialog.Close
                  render={<Button type="button" variant="outline" />}
                  disabled={isPending}
                >
                  취소
                </Dialog.Close>
                <Button type="submit" disabled={isPending}>
                  {isPending ? '만드는 중...' : '방 만들기'}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
