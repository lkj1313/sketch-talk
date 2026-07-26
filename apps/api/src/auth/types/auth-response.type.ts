export interface AuthResultWithRefreshToken<T> {
  result: T;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: string;
}
