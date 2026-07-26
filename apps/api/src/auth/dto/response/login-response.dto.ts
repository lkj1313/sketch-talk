import type { LoginResponse } from '@sketch-talk/contracts';
import { AuthUserResponseDto } from '@/auth/dto/response/auth-user-response.dto';

export class LoginResponseDto implements LoginResponse {
  accessToken: string;
  user: AuthUserResponseDto;

  constructor(accessToken: string, user: AuthUserResponseDto) {
    this.accessToken = accessToken;
    this.user = user;
  }
}
