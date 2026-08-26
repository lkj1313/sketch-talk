import { Injectable } from '@nestjs/common';
import { GUEST_SESSION_EXPIRES_IN_MS } from '@/guest-session/constants/guest-session.constants';
import { GuestSessionResponseDto } from '@/guest-session/dto/guest-session-response.dto';
import type { IssuedGuestSession } from '@/guest-session/types/guest-session.type';
import {
  createGuestToken,
  hashGuestToken,
} from '@/guest-session/utils/guest-token.util';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GuestSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(existingGuestToken?: string): Promise<IssuedGuestSession> {
    if (existingGuestToken) {
      const existingSession = await this.prisma.guestSession.findUnique({
        where: {
          tokenHash: hashGuestToken(existingGuestToken),
        },
        select: {
          expiresAt: true,
        },
      });

      if (existingSession && existingSession.expiresAt > new Date()) {
        return {
          result: new GuestSessionResponseDto(existingSession.expiresAt),
          guestToken: existingGuestToken,
        };
      }
    }

    const guestToken = createGuestToken();
    const expiresAt = new Date(Date.now() + GUEST_SESSION_EXPIRES_IN_MS);

    await this.prisma.guestSession.create({
      data: {
        tokenHash: hashGuestToken(guestToken),
        expiresAt,
      },
    });

    return {
      result: new GuestSessionResponseDto(expiresAt),
      guestToken,
    };
  }
}
