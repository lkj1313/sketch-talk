import { Controller, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { ControllerResponse } from '@/common/types/api-response.type';
import {
  GUEST_SESSION_EXPIRES_IN_MS,
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
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse<GuestSessionResponseDto>> {
    const { result, guestToken } = await this.guestSessionService.issue();
    response.cookie(
      GUEST_TOKEN_COOKIE_NAME,
      guestToken,
      this.getGuestTokenCookieOptions(),
    );

    return { data: result };
  }

  private getGuestTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: GUEST_TOKEN_COOKIE_PATH,
      maxAge: GUEST_SESSION_EXPIRES_IN_MS,
    };
  }
}
