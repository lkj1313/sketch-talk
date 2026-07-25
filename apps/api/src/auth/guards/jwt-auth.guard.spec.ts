import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types/auth-request.type';
import { AppException } from '@/common/exceptions/app.exception';

describe('JwtAuthGuard', () => {
  const verifyAsync = jest.fn();
  const jwtService = {
    verifyAsync,
  } as unknown as JwtService;
  const guard = new JwtAuthGuard(jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('유효한 Access Token이면 요청에 사용자 정보를 저장한다', async () => {
    const request = createRequest('Bearer valid-token');
    const context = createExecutionContext(request);
    verifyAsync.mockResolvedValue({
      sub: 'user-id',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      sub: 'user-id',
    });
  });

  it('Access Token이 없으면 AUTH_ACCESS_TOKEN_REQUIRED 오류를 발생시킨다', async () => {
    const context = createExecutionContext(createRequest());

    const error = await getGuardError(guard, context);

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_ACCESS_TOKEN_REQUIRED',
      message: 'Access Token이 필요합니다.',
    });
  });

  it('Access Token 검증에 실패하면 AUTH_INVALID_ACCESS_TOKEN 오류를 발생시킨다', async () => {
    const context = createExecutionContext(
      createRequest('Bearer invalid-token'),
    );
    verifyAsync.mockRejectedValue(new Error('invalid token'));

    const error = await getGuardError(guard, context);

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({
      code: 'AUTH_INVALID_ACCESS_TOKEN',
      message: '유효하지 않거나 만료된 Access Token입니다.',
    });
  });
});

function createRequest(authorization?: string): AuthenticatedRequest {
  return {
    headers: {
      authorization,
    },
  } as unknown as AuthenticatedRequest;
}

function createExecutionContext(
  request: AuthenticatedRequest,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

async function getGuardError(
  guard: JwtAuthGuard,
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
