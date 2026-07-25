import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { LoginDto } from '@/auth/dto/login.dto';
import { SignupDto } from '@/auth/dto/signup.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type {
  AccessTokenPayload,
  LoginResult,
  SignupUser,
} from '@/auth/types/auth-response.type';
import type { ControllerResponse } from '@/common/types/api-response.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
  ): Promise<ControllerResponse<SignupUser>> {
    const user = await this.authService.signup(dto);

    return { data: user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<ControllerResponse<LoginResult>> {
    const result = await this.authService.login(dto);

    return { data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(
    @CurrentUser() currentUser: AccessTokenPayload,
  ): Promise<ControllerResponse<SignupUser>> {
    const user = await this.authService.getMe(currentUser.sub);

    return { data: user };
  }
}
