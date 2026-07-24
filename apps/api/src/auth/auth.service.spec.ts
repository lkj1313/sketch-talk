import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '@/auth/auth.service';
import { AppException } from '@/common/exceptions/app.exception';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('AuthService', () => {
  const userCreate = jest.fn();
  const prisma = {
    user: {
      create: userCreate,
    },
  } as unknown as PrismaService;
  const authService = new AuthService(prisma);
  const signupDto = {
    email: 'test@example.com',
    password: 'password1234',
    nickname: '그림왕',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('중복 이메일이면 AUTH_EMAIL_ALREADY_EXISTS 오류를 발생시킨다', async () => {
    userCreate.mockRejectedValue(createUniqueConstraintError(['email']));

    const error = await getSignupError(authService, signupDto);

    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_EMAIL_ALREADY_EXISTS',
      message: '이미 사용 중인 이메일입니다.',
    });
  });

  it('중복 닉네임이면 AUTH_NICKNAME_ALREADY_EXISTS 오류를 발생시킨다', async () => {
    userCreate.mockRejectedValue(createUniqueConstraintError(['nickname']));

    const error = await getSignupError(authService, signupDto);

    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_NICKNAME_ALREADY_EXISTS',
      message: '이미 사용 중인 닉네임입니다.',
    });
  });
});

function createUniqueConstraintError(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.9.0',
    meta: {
      driverAdapterError: {
        cause: {
          constraint: {
            fields: target,
          },
        },
      },
    },
  });
}

async function getSignupError(
  authService: AuthService,
  signupDto: {
    email: string;
    password: string;
    nickname: string;
  },
): Promise<AppException> {
  try {
    await authService.signup(signupDto);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}
