import { SignupForm } from '@/features/auth-signup'

export function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">회원가입</h1>
          <p className="text-sm text-muted-foreground">
            계정을 만들고 게임 기록을 저장해보세요.
          </p>
        </div>

        <SignupForm />
      </section>
    </main>
  )
}
