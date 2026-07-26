import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  BCRYPT_DUMMY_HASH,
  BCRYPT_SALT_ROUNDS,
} from '@/auth/constants/auth.constants';
import { AUTH_ERROR } from '@/auth/constants/auth-error.constants';
import { LoginDto } from '@/auth/dto/login.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { SignupDto } from '@/auth/dto/signup.dto';
import { AppException } from '@/common/exceptions/app.exception';
import { Prisma } from '@/generated/prisma/client';
import {
  AuthResultWithRefreshToken,
  AccessTokenPayload,
  LoginResult,
  RefreshResult,
  SignupUser,
} from '@/auth/types/auth-response.type';
import {
  createRefreshToken,
  hashRefreshToken,
} from '@/auth/utils/refresh-token.util';
import { REFRESH_TOKEN_EXPIRES_IN_MS } from '@/auth/constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<SignupUser> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          nickname: dto.nickname,
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppException(this.getUniqueConstraintError(error));
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResultWithRefreshToken<LoginResult>> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    const passwordHash = user?.passwordHash ?? BCRYPT_DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !isPasswordValid) {
      throw new AppException(AUTH_ERROR.INVALID_CREDENTIALS);
    }

    const payload: AccessTokenPayload = {
      sub: user.id,
    };
    const refreshToken = createRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
    const [accessToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastLoginAt: new Date(),
        },
      }),
      this.prisma.authSession.create({
        data: {
          userId: user.id,
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt,
        },
      }),
    ]);

    return {
      result: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      },
      refreshToken,
    };
  }

  async refresh(
    refreshToken: string | undefined,
  ): Promise<AuthResultWithRefreshToken<RefreshResult>> {
    if (!refreshToken) {
      throw new AppException(AUTH_ERROR.REFRESH_TOKEN_REQUIRED);
    }

    const now = new Date();
    const session = await this.prisma.authSession.findUnique({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= now) {
      throw new AppException(AUTH_ERROR.INVALID_REFRESH_TOKEN);
    }

    const nextRefreshToken = createRefreshToken();
    const nextExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRES_IN_MS);
    const accessToken = await this.jwtService.signAsync({
      sub: session.userId,
    });

    await this.prisma.$transaction(async (transaction) => {
      const revokedSession = await transaction.authSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          revokedAt: now,
        },
      });

      if (revokedSession.count !== 1) {
        throw new AppException(AUTH_ERROR.INVALID_REFRESH_TOKEN);
      }

      await transaction.authSession.create({
        data: {
          userId: session.userId,
          tokenHash: hashRefreshToken(nextRefreshToken),
          expiresAt: nextExpiresAt,
        },
      });
    });

    return {
      result: { accessToken },
      refreshToken: nextRefreshToken,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.prisma.authSession.updateMany({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async getMe(userId: string): Promise<SignupUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppException(AUTH_ERROR.INVALID_ACCESS_TOKEN);
    }

    return user;
  }

  private getUniqueConstraintError(
    error: Prisma.PrismaClientKnownRequestError,
  ) {
    const fields = this.getUniqueConstraintFields(error);

    if (fields.some((field) => field.includes('email'))) {
      return AUTH_ERROR.EMAIL_ALREADY_EXISTS;
    }

    if (fields.some((field) => field.includes('nickname'))) {
      return AUTH_ERROR.NICKNAME_ALREADY_EXISTS;
    }

    return AUTH_ERROR.USER_ALREADY_EXISTS;
  }

  private getUniqueConstraintFields(
    error: Prisma.PrismaClientKnownRequestError,
  ): string[] {
    const targetFields = this.toStringArray(error.meta?.target);

    if (targetFields.length > 0) {
      return targetFields;
    }

    const driverAdapterError = error.meta?.driverAdapterError;

    if (!this.isRecord(driverAdapterError)) {
      return [];
    }

    const cause = driverAdapterError.cause;

    if (!this.isRecord(cause) || !this.isRecord(cause.constraint)) {
      return [];
    }

    return this.toStringArray(cause.constraint.fields);
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    return typeof value === 'string' ? [value] : [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
