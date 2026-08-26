import { Controller, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import type { ControllerResponse } from '@/common/types/api-response.type';
import {
  GUEST_TOKEN_COOKIE_NAME,
  GUEST_TOKEN_COOKIE_PATH,
} from '@/guest-session/constants/guest-session.constants';
import { GuestSessionResponseDto } from '@/guest-session/dto/guest-session-response.dto';
import { GuestSessionService } from '@/guest-session/guest-session.service';

@Controller('guest-sessions')
export class GuestSessionController {
  constructor(
    private readonly guestSessionService: GuestSessionService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async issue(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse<GuestSessionResponseDto>> {
    const { result, guestToken } = await this.guestSessionService.issue(
      this.getGuestTokenCookie(request),
    );
    response.cookie(
      GUEST_TOKEN_COOKIE_NAME,
      guestToken,
      this.getGuestTokenCookieOptions(result.expiresAt),
    );

    return { data: result };
  }

  private getGuestTokenCookie(request: Request): string | undefined {
    const value: unknown = request.cookies?.[GUEST_TOKEN_COOKIE_NAME];

    return typeof value === 'string' ? value : undefined;
  }

  private getGuestTokenCookieOptions(expiresAt: string): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: GUEST_TOKEN_COOKIE_PATH,
      maxAge: Math.max(0, new Date(expiresAt).getTime() - Date.now()),
    };
  }
}
