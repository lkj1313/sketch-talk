import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { useSessionStore } from '@/entities/session'
import { toast } from '@/shared/ui'

import { getJoinRoomErrorMessage } from '../api/join-room'
import {
  getJoinRoomSchema,
  type JoinRoomFormValues,
} from './join-room-schema'
import { useJoinRoom } from './use-join-room'

export function useJoinRoomForm(code: string) {
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

  function submit(values: JoinRoomFormValues): void {
    joinRoomMutation.mutate(isGuest ? { nickname: values.nickname } : {}, {
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
    })
  }

  return {
    errors,
    isGuest,
    isPending: joinRoomMutation.isPending,
    register,
    submit: handleSubmit(submit),
  }
}
