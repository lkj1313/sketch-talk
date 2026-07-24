import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { SignupDto } from '@/auth/dto/signup.dto';
import { SignupUser } from '@/auth/types/auth-response.type';
import { ControllerResponse } from '@/common/types/api-response.type';

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
}
