export const BCRYPT_SALT_ROUNDS = 12;
export const BCRYPT_DUMMY_HASH =
  '$2b$12$FX344nYX.Lv9IyIa8iCGNeqFamd7XxFv/9GCXBPmXe024naUUebam';
export const JWT_ACCESS_EXPIRES_IN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_BYTE_LENGTH = 48;
export const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';
