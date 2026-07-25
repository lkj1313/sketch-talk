export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export type SignupUser = AuthUser;

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export interface AccessTokenPayload {
  sub: string;
}
