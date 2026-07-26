import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '@/auth/auth.service';
import { AppException } from '@/common/exceptions/app.exception';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn((password: string) =>
    Promise.resolve(password === 'password1234'),
  ),
}));

describe('AuthService', () => {
  const userCreate = jest.fn();
  const userFindUnique = jest.fn();
  const userUpdate = jest.fn();
  const authSessionCreate = jest.fn();
  const authSessionFindUnique = jest.fn();
  const authSessionUpdateMany = jest.fn();
  const transaction = jest.fn();
  const signAsync = jest.fn();
  const prisma = {
    user: {
      create: userCreate,
      findUnique: userFindUnique,
      update: userUpdate,
    },
    authSession: {
      create: authSessionCreate,
      findUnique: authSessionFindUnique,
      updateMany: authSessionUpdateMany,
    },
    $transaction: transaction,
  } as unknown as PrismaService;
  const jwtService = {
    signAsync,
  } as unknown as JwtService;
  const authService = new AuthService(prisma, jwtService);
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

  it('이메일과 비밀번호가 일치하면 Access Token을 반환한다', async () => {
    const user = {
      id: 'user-id',
      email: signupDto.email,
      passwordHash: 'hashed-password',
      nickname: signupDto.nickname,
      avatarUrl: null,
      createdAt: new Date(),
    };
    userFindUnique.mockResolvedValue(user);
    signAsync.mockResolvedValue('access-token');
    userUpdate.mockResolvedValue(user);
    authSessionCreate.mockResolvedValue({});

    await expect(
      authService.login({
        email: signupDto.email,
        password: signupDto.password,
      }),
    ).resolves.toEqual({
      result: {
        accessToken: 'access-token',
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt.toISOString(),
        },
      },
      refreshToken: expect.any(String),
    });
    expect(signAsync).toHaveBeenCalledWith({
      sub: user.id,
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: expect.any(Date),
      },
    });
    expect(authSessionCreate).toHaveBeenCalledWith({
      data: {
        userId: user.id,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      },
    });
  });

  it('Refresh Token을 회전하고 새 Access Token을 반환한다', async () => {
    authSessionFindUnique.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    authSessionUpdateMany.mockResolvedValue({ count: 1 });
    authSessionCreate.mockResolvedValue({});
    signAsync.mockResolvedValue('new-access-token');
    transaction.mockImplementation(
      async (callback: (transaction: PrismaService) => Promise<unknown>) =>
        callback(prisma),
    );

    await expect(authService.refresh('refresh-token')).resolves.toEqual({
      result: {
        accessToken: 'new-access-token',
      },
      refreshToken: expect.any(String),
    });
    expect(authSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'session-id' }),
        data: { revokedAt: expect.any(Date) },
      }),
    );
    expect(authSessionCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      },
    });
  });

  it('Refresh Token이 없으면 AUTH_REFRESH_TOKEN_REQUIRED 오류를 발생시킨다', async () => {
    const error = await getRefreshError(authService, undefined);

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_REFRESH_TOKEN_REQUIRED',
      message: 'Refresh Token이 필요합니다.',
    });
  });

  it('만료된 Refresh Token이면 AUTH_INVALID_REFRESH_TOKEN 오류를 발생시킨다', async () => {
    authSessionFindUnique.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      expiresAt: new Date(Date.now() - 60_000),
      revokedAt: null,
    });

    const error = await getRefreshError(authService, 'expired-token');

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_INVALID_REFRESH_TOKEN',
      message: '유효하지 않거나 만료된 Refresh Token입니다.',
    });
  });

  it('사용자가 없으면 AUTH_INVALID_CREDENTIALS 오류를 발생시킨다', async () => {
    userFindUnique.mockResolvedValue(null);

    const error = await getLoginError(authService, {
      email: signupDto.email,
      password: signupDto.password,
    });

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    });
    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it('비밀번호가 일치하지 않으면 AUTH_INVALID_CREDENTIALS 오류를 발생시킨다', async () => {
    userFindUnique.mockResolvedValue({
      id: 'user-id',
      email: signupDto.email,
      passwordHash: 'hashed-password',
      nickname: signupDto.nickname,
      avatarUrl: null,
      createdAt: new Date(),
    });

    const error = await getLoginError(authService, {
      email: signupDto.email,
      password: 'wrong-password',
    });

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    });
  });

  it('사용자 ID로 현재 사용자 정보를 반환한다', async () => {
    const user = {
      id: 'user-id',
      email: signupDto.email,
      nickname: signupDto.nickname,
      avatarUrl: null,
      createdAt: new Date(),
    };
    userFindUnique.mockResolvedValue(user);

    await expect(authService.getMe(user.id)).resolves.toEqual({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  });

  it('사용자를 찾을 수 없으면 AUTH_INVALID_ACCESS_TOKEN 오류를 발생시킨다', async () => {
    userFindUnique.mockResolvedValue(null);

    const error = await getMeError(authService, 'deleted-user-id');

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_INVALID_ACCESS_TOKEN',
      message: '유효하지 않거나 만료된 Access Token입니다.',
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

async function getLoginError(
  authService: AuthService,
  loginDto: {
    email: string;
    password: string;
  },
): Promise<AppException> {
  try {
    await authService.login(loginDto);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}

async function getMeError(
  authService: AuthService,
  userId: string,
): Promise<AppException> {
  try {
    await authService.getMe(userId);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}

async function getRefreshError(
  authService: AuthService,
  refreshToken: string | undefined,
): Promise<AppException> {
  try {
    await authService.refresh(refreshToken);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}
