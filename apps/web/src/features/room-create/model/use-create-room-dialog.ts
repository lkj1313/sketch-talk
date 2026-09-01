import { zodResolver } from '@hookform/resolvers/zod'
import type { CreateRoomRequest } from '@sketch-talk/contracts'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session'
import { toast } from '@/shared/ui'

import { getCreateRoomErrorMessage } from '../api/create-room'
import {
  getCreateRoomSchema,
  type CreateRoomFormValues,
} from './create-room-schema'
import { useCreateRoom } from './use-create-room'

const DEFAULT_VALUES: CreateRoomFormValues = {
  title: '',
  visibility: 'PUBLIC',
  maxPlayers: 8,
  allowMidJoin: true,
  nickname: '',
}

export function useCreateRoomDialog() {
  const navigate = useNavigate()
  const accessToken = useSessionStore((state) => state.accessToken)
  const isGuest = !accessToken
  const [open, setOpen] = useState(false)
  const createRoomMutation = useCreateRoom()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoomFormValues>({
    resolver: zodResolver(getCreateRoomSchema(isGuest)),
    defaultValues: DEFAULT_VALUES,
  })

  function handleOpenChange(nextOpen: boolean): void {
    if (createRoomMutation.isPending) {
      return
    }

    setOpen(nextOpen)

    if (!nextOpen) {
      reset(DEFAULT_VALUES)
    }
  }

  function submit(values: CreateRoomFormValues): void {
    const request: CreateRoomRequest = {
      title: values.title,
      visibility: values.visibility,
      maxPlayers: values.maxPlayers,
      allowMidJoin: values.allowMidJoin,
      ...(isGuest ? { nickname: values.nickname } : {}),
    }

    createRoomMutation.mutate(request, {
      onSuccess: (room) => {
        setOpen(false)
        reset(DEFAULT_VALUES)
        toast.add({
          title: '방을 만들었습니다.',
          type: 'success',
        })
        void navigate(`/rooms/${room.code}`)
      },
      onError: (error) => {
        toast.add({
          title: '방을 만들지 못했습니다.',
          description: getCreateRoomErrorMessage(error),
          type: 'error',
        })
      },
    })
  }

  return {
    errors,
    handleOpenChange,
    isGuest,
    isPending: createRoomMutation.isPending,
    open,
    register,
    submit: handleSubmit(submit),
  }
}
