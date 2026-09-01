import { Link } from 'react-router-dom'

import { Button, Input, Label } from '@/shared/ui'

import { useSignupForm } from '../model/use-signup-form'

export function SignupForm() {
  const {
    errors,
    isPending,
    register,
    serverErrorMessage,
    submit,
  } = useSignupForm()

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
          autoComplete="new-password"
          placeholder="12자 이상 입력해주세요"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password?.message && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          autoComplete="nickname"
          placeholder="2자 이상 입력해주세요"
          aria-invalid={Boolean(errors.nickname)}
          {...register('nickname')}
        />
        {errors.nickname?.message && (
          <p className="text-sm text-destructive">{errors.nickname.message}</p>
        )}
      </div>

      {serverErrorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {serverErrorMessage}
        </p>
      )}

      <Button className="h-11 w-full" type="submit" disabled={isPending}>
        {isPending ? '가입 중...' : '회원가입'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link
          className="font-medium text-foreground hover:underline"
          to="/login"
        >
          로그인
        </Link>
      </p>
    </form>
  )
}
