import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { ActorGuard } from '@/auth/guards/actor.guard';
import { JWT_ACCESS_EXPIRES_IN_SECONDS } from '@/auth/constants/auth.constants';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: JWT_ACCESS_EXPIRES_IN_SECONDS,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, ActorGuard],
  exports: [ActorGuard, JwtModule],
})
export class AuthModule {}
