import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session'
import { toast } from '@/shared/ui'

import { getLoginErrorMessage } from '../api/login'
import { loginSchema, type LoginFormValues } from './login-schema'
import { useLogin } from './use-login'

export function useLoginForm() {
  const navigate = useNavigate()
  const setSession = useSessionStore((state) => state.setSession)
  const loginMutation = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function submit(values: LoginFormValues): void {
    loginMutation.mutate(values, {
      onSuccess: ({ accessToken, user }) => {
        setSession(accessToken, user)
        toast.add({
          title: '로그인되었습니다.',
          type: 'success',
        })
        void navigate('/lobby', { replace: true })
      },
      onError: (error) => {
        toast.add({
          title: '로그인에 실패했습니다.',
          description: getLoginErrorMessage(error),
          type: 'error',
        })
      },
    })
  }

  return {
    errors,
    isPending: loginMutation.isPending,
    register,
    submit: handleSubmit(submit),
  }
}
