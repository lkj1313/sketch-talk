import { z } from 'zod'

const baseJoinRoomSchema = z.object({
  nickname: z
    .string()
    .trim()
    .max(30, '닉네임은 30자 이하여야 합니다.'),
})

export function getJoinRoomSchema(isGuest: boolean) {
  return baseJoinRoomSchema.superRefine((values, context) => {
    if (isGuest && values.nickname.length < 2) {
      context.addIssue({
        code: 'custom',
        path: ['nickname'],
        message: '닉네임은 2자 이상이어야 합니다.',
      })
    }
  })
}

export type JoinRoomFormValues = z.infer<typeof baseJoinRoomSchema>
