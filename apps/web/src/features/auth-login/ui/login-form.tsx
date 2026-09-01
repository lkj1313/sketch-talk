import { Link } from 'react-router-dom'

import { Button, Input, Label } from '@/shared/ui'

import { useLoginForm } from '../model/use-login-form'

export function LoginForm() {
  const { errors, isPending, register, submit } = useLoginForm()

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
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
        disabled={isPending}
      >
        {isPending ? '로그인 중...' : '로그인'}
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
