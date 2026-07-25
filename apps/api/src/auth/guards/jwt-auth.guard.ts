import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AUTH_ERROR } from '@/auth/constants/auth-error.constants';
import { AuthenticatedRequest } from '@/auth/types/auth-request.type';
import { AccessTokenPayload } from '@/auth/types/auth-response.type';
import { AppException } from '@/common/exceptions/app.exception';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new AppException(AUTH_ERROR.ACCESS_TOKEN_REQUIRED);
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      if (typeof payload.sub !== 'string') {
        throw new AppException(AUTH_ERROR.INVALID_ACCESS_TOKEN);
      }

      request.user = {
        sub: payload.sub,
      };

      return true;
    } catch {
      throw new AppException(AUTH_ERROR.INVALID_ACCESS_TOKEN);
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' && token ? token : undefined;
  }
}
