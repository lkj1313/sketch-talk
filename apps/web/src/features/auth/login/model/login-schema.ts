import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('올바른 이메일 주소를 입력해주세요.')
    .max(320, '이메일은 320자 이하여야 합니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
