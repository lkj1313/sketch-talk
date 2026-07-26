import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ActorRequest } from '@/auth/types/auth-request.type';
import { ActorGuard } from '@/auth/guards/actor.guard';
import { AppException } from '@/common/exceptions/app.exception';
import { PrismaService } from '@/prisma/prisma.service';

describe('ActorGuard', () => {
  const verifyAsync = jest.fn();
  const guestSessionFindUnique = jest.fn();
  const jwtService = {
    verifyAsync,
  } as unknown as JwtService;
  const prisma = {
    guestSession: {
      findUnique: guestSessionFindUnique,
    },
  } as unknown as PrismaService;
  const guard = new ActorGuard(jwtService, prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('유효한 Access Token이면 회원 요청자를 저장한다', async () => {
    const request = createRequest({ authorization: 'Bearer valid-token' });
    verifyAsync.mockResolvedValue({ sub: 'user-id' });

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(request.actor).toEqual({
      type: 'USER',
      userId: 'user-id',
    });
    expect(guestSessionFindUnique).not.toHaveBeenCalled();
  });

  it('Access Token이 없고 Guest Token이 유효하면 비회원 요청자를 저장한다', async () => {
    const request = createRequest({ guestToken: 'valid-guest-token' });
    guestSessionFindUnique.mockResolvedValue({
      id: 'guest-session-id',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(request.actor).toEqual({
      type: 'GUEST',
      guestSessionId: 'guest-session-id',
    });
  });

  it('두 토큰이 모두 없으면 AUTH_ACTOR_REQUIRED 오류를 발생시킨다', async () => {
    const error = await getGuardError(
      guard,
      createExecutionContext(createRequest()),
    );

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_ACTOR_REQUIRED',
      message: '회원 Access Token 또는 비회원 Guest Token이 필요합니다.',
    });
  });

  it('Guest Token을 찾을 수 없으면 GUEST_SESSION_INVALID_TOKEN 오류를 발생시킨다', async () => {
    guestSessionFindUnique.mockResolvedValue(null);
    const error = await getGuardError(
      guard,
      createExecutionContext(createRequest({ guestToken: 'invalid-token' })),
    );

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'GUEST_SESSION_INVALID_TOKEN',
      message: '유효하지 않은 Guest Token입니다.',
    });
  });

  it('비회원 세션이 만료됐으면 GUEST_SESSION_EXPIRED 오류를 발생시킨다', async () => {
    guestSessionFindUnique.mockResolvedValue({
      id: 'guest-session-id',
      expiresAt: new Date(Date.now() - 60_000),
    });
    const error = await getGuardError(
      guard,
      createExecutionContext(createRequest({ guestToken: 'expired-token' })),
    );

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'GUEST_SESSION_EXPIRED',
      message: '만료된 비회원 세션입니다.',
    });
  });

  it('Access Token 헤더가 있으면 Guest Token으로 대체하지 않는다', async () => {
    verifyAsync.mockRejectedValue(new Error('invalid token'));
    const request = createRequest({
      authorization: 'Bearer invalid-token',
      guestToken: 'valid-guest-token',
    });
    const error = await getGuardError(guard, createExecutionContext(request));

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_INVALID_ACCESS_TOKEN',
      message: '유효하지 않거나 만료된 Access Token입니다.',
    });
    expect(guestSessionFindUnique).not.toHaveBeenCalled();
  });
});

function createRequest(options?: {
  authorization?: string;
  guestToken?: string;
}): ActorRequest {
  return {
    headers: {
      authorization: options?.authorization,
    },
    cookies: options?.guestToken
      ? {
          guestToken: options.guestToken,
        }
      : {},
  } as unknown as ActorRequest;
}

function createExecutionContext(request: ActorRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

async function getGuardError(
  guard: ActorGuard,
  context: ExecutionContext,
): Promise<AppException> {
  try {
    await guard.canActivate(context);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}
