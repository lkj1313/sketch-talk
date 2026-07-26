import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { parseCookie } from 'cookie';
import type { Socket } from 'socket.io';
import { AUTH_ERROR } from '@/auth/constants/auth-error.constants';
import type { AccessTokenPayload } from '@/auth/types/auth-response.type';
import type { RequestActor } from '@/auth/types/request-actor.type';
import { AppException } from '@/common/exceptions/app.exception';
import { GUEST_TOKEN_COOKIE_NAME } from '@/guest-session/constants/guest-session.constants';
import { GUEST_SESSION_ERROR } from '@/guest-session/constants/guest-session-error.constants';
import { hashGuestToken } from '@/guest-session/utils/guest-token.util';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticate(socket: Socket): Promise<RequestActor> {
    const accessToken: unknown = socket.handshake.auth?.accessToken;

    if (accessToken !== undefined) {
      return this.authenticateUser(accessToken);
    }

    const guestToken = this.extractGuestToken(socket);

    if (!guestToken) {
      throw new AppException(AUTH_ERROR.ACTOR_REQUIRED);
    }

    return this.authenticateGuest(guestToken);
  }

  private async authenticateUser(accessToken: unknown): Promise<RequestActor> {
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      throw new AppException(AUTH_ERROR.INVALID_ACCESS_TOKEN);
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken);

      if (typeof payload.sub !== 'string') {
        throw new Error('Access Token subject is missing.');
      }

      return { type: 'USER', userId: payload.sub };
    } catch {
      throw new AppException(AUTH_ERROR.INVALID_ACCESS_TOKEN);
    }
  }

  private async authenticateGuest(guestToken: string): Promise<RequestActor> {
    const guestSession = await this.prisma.guestSession.findUnique({
      where: { tokenHash: hashGuestToken(guestToken) },
      select: { id: true, expiresAt: true },
    });

    if (!guestSession) {
      throw new AppException(GUEST_SESSION_ERROR.INVALID_TOKEN);
    }

    if (guestSession.expiresAt <= new Date()) {
      throw new AppException(GUEST_SESSION_ERROR.EXPIRED);
    }

    return { type: 'GUEST', guestSessionId: guestSession.id };
  }

  private extractGuestToken(socket: Socket): string | undefined {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    return parseCookie(cookieHeader)[GUEST_TOKEN_COOKIE_NAME];
  }
}
