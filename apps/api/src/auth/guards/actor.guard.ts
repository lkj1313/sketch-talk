import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AUTH_ERROR } from '@/auth/constants/auth-error.constants';
import type { ActorRequest } from '@/auth/types/auth-request.type';
import type { AccessTokenPayload } from '@/auth/types/auth-response.type';
import { AppException } from '@/common/exceptions/app.exception';
import { GUEST_TOKEN_COOKIE_NAME } from '@/guest-session/constants/guest-session.constants';
import { GUEST_SESSION_ERROR } from '@/guest-session/constants/guest-session-error.constants';
import { hashGuestToken } from '@/guest-session/utils/guest-token.util';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ActorGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ActorRequest>();

    if (request.headers.authorization !== undefined) {
      await this.authenticateUser(request);

      return true;
    }

    const guestToken = this.extractGuestToken(request);

    if (!guestToken) {
      throw new AppException(AUTH_ERROR.ACTOR_REQUIRED);
    }

    await this.authenticateGuest(request, guestToken);

    return true;
  }

  private async authenticateUser(request: ActorRequest): Promise<void> {
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new AppException(AUTH_ERROR.INVALID_ACCESS_TOKEN);
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      if (typeof payload.sub !== 'string') {
        throw new Error('Access Token subject is missing.');
      }

      request.actor = {
        type: 'USER',
        userId: payload.sub,
      };
    } catch {
      throw new AppException(AUTH_ERROR.INVALID_ACCESS_TOKEN);
    }
  }

  private async authenticateGuest(
    request: ActorRequest,
    guestToken: string,
  ): Promise<void> {
    const guestSession = await this.prisma.guestSession.findUnique({
      where: {
        tokenHash: hashGuestToken(guestToken),
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    if (!guestSession) {
      throw new AppException(GUEST_SESSION_ERROR.INVALID_TOKEN);
    }

    if (guestSession.expiresAt <= new Date()) {
      throw new AppException(GUEST_SESSION_ERROR.EXPIRED);
    }

    request.actor = {
      type: 'GUEST',
      guestSessionId: guestSession.id,
    };
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' && token ? token : undefined;
  }

  private extractGuestToken(request: Request): string | undefined {
    const value: unknown = request.cookies?.[GUEST_TOKEN_COOKIE_NAME];

    return typeof value === 'string' ? value : undefined;
  }
}
