import { z } from 'zod'

const BCRYPT_MAX_PASSWORD_BYTES = 72

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('올바른 이메일 주소를 입력해주세요.')
    .max(320, '이메일은 320자 이하여야 합니다.'),
  password: z
    .string()
    .min(12, '비밀번호는 12자 이상이어야 합니다.')
    .refine(
      (value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_PASSWORD_BYTES,
      '비밀번호가 너무 깁니다.',
    ),
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(30, '닉네임은 30자 이하여야 합니다.'),
})

export type SignupFormValues = z.infer<typeof signupSchema>
