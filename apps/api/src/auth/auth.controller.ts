import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from '@/auth/auth.service';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
  REFRESH_TOKEN_EXPIRES_IN_MS,
} from '@/auth/constants/auth.constants';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { LoginDto } from '@/auth/dto/login.dto';
import { SignupDto } from '@/auth/dto/signup.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type {
  AccessTokenPayload,
  LoginResult,
  RefreshResult,
  SignupUser,
} from '@/auth/types/auth-response.type';
import type { ControllerResponse } from '@/common/types/api-response.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
  ): Promise<ControllerResponse<SignupUser>> {
    const user = await this.authService.signup(dto);

    return { data: user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse<LoginResult>> {
    const { result, refreshToken } = await this.authService.login(dto);
    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      this.getRefreshTokenCookieOptions(),
    );

    return { data: result };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse<RefreshResult>> {
    const { result, refreshToken } = await this.authService.refresh(
      this.getRefreshTokenCookie(request),
    );
    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      this.getRefreshTokenCookieOptions(),
    );

    return { data: result };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse<null>> {
    await this.authService.logout(this.getRefreshTokenCookie(request));
    response.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      this.getRefreshTokenCookieOptions(),
    );

    return { data: null };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(
    @CurrentUser() currentUser: AccessTokenPayload,
  ): Promise<ControllerResponse<SignupUser>> {
    const user = await this.authService.getMe(currentUser.sub);

    return { data: user };
  }

  private getRefreshTokenCookie(request: Request): string | undefined {
    const value: unknown = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    return typeof value === 'string' ? value : undefined;
  }

  private getRefreshTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
    };
  }
}
