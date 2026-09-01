import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { toast } from '@/shared/ui'

import { getSignupErrorMessage } from '../api/signup'
import { signupSchema, type SignupFormValues } from './signup-schema'
import { useSignup } from './use-signup'

export function useSignupForm() {
  const navigate = useNavigate()
  const signupMutation = useSignup()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      nickname: '',
    },
  })

  function submit(values: SignupFormValues): void {
    signupMutation.mutate(values, {
      onSuccess: () => {
        toast.add({
          title: '회원가입이 완료되었습니다.',
          description: '로그인해주세요.',
          type: 'success',
        })
        void navigate('/login', { replace: true })
      },
    })
  }

  return {
    errors,
    isPending: signupMutation.isPending,
    register,
    serverErrorMessage: getSignupErrorMessage(signupMutation.error),
    submit: handleSubmit(submit),
  }
}
