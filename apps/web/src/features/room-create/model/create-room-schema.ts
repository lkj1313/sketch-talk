import { z } from 'zod'

const baseCreateRoomSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '방 제목을 입력해주세요.')
    .max(50, '방 제목은 50자 이하여야 합니다.'),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  maxPlayers: z
    .number()
    .int()
    .min(2, '최대 인원은 2명 이상이어야 합니다.')
    .max(12, '최대 인원은 12명 이하여야 합니다.'),
  allowMidJoin: z.boolean(),
  nickname: z
    .string()
    .trim()
    .max(30, '닉네임은 30자 이하여야 합니다.'),
})

export function getCreateRoomSchema(isGuest: boolean) {
  return baseCreateRoomSchema.superRefine((values, context) => {
    if (isGuest && values.nickname.length < 2) {
      context.addIssue({
        code: 'custom',
        path: ['nickname'],
        message: '닉네임은 2자 이상이어야 합니다.',
      })
    }
  })
}

export type CreateRoomFormValues = z.infer<typeof baseCreateRoomSchema>
