import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { Button, Input, Label, toast } from "@/shared/ui";

import { getSignupErrorMessage } from "../api/signup";
import { signupSchema, type SignupFormValues } from "../model/signup-schema";
import { useSignup } from "../model/use-signup";

export function SignupForm() {
  const navigate = useNavigate();
  const signupMutation = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      nickname: "",
    },
  });

  const serverErrorMessage = getSignupErrorMessage(signupMutation.error);

  function onSubmit(values: SignupFormValues): void {
    signupMutation.mutate(values, {
      onSuccess: () => {
        toast.add({
          title: "회원가입이 완료되었습니다.",
          description: "로그인해주세요.",
          type: "success",
        });
        void navigate("/login", { replace: true });
      },
    });
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
          {...register("email")}
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
          {...register("password")}
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
          {...register("nickname")}
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

      <Button
        className="h-11 w-full"
        type="submit"
        disabled={signupMutation.isPending}
      >
        {signupMutation.isPending ? "가입 중..." : "회원가입"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link
          className="font-medium text-foreground hover:underline"
          to="/login"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}
