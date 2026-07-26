export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;
}

export type SignupResponse = AuthUser;

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}
