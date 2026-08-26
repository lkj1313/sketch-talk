import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session'
import { Button, Input, Label, toast } from '@/shared/ui'

import { getLoginErrorMessage } from '../api/login'
import { loginSchema, type LoginFormValues } from '../model/login-schema'
import { useLogin } from '../model/use-login'

export function LoginForm() {
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

  function onSubmit(values: LoginFormValues): void {
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

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="example@email.com"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email?.message && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력해주세요"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password?.message && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button
        className="h-11 w-full"
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? '로그인 중...' : '로그인'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        아직 계정이 없으신가요?{' '}
        <Link
          className="font-medium text-foreground hover:underline"
          to="/signup"
        >
          회원가입
        </Link>
      </p>
    </form>
  )
}
