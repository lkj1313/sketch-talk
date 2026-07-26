import type { AuthUser } from '@sketch-talk/contracts';

type AuthUserSource = Omit<AuthUser, 'createdAt'> & {
  createdAt: Date;
};

export class AuthUserResponseDto implements AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;

  constructor(user: AuthUserSource) {
    this.id = user.id;
    this.email = user.email;
    this.nickname = user.nickname;
    this.avatarUrl = user.avatarUrl;
    this.createdAt = user.createdAt.toISOString();
  }
}
