import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { configureApp } from '@/app.setup';
import { PrismaService } from '@/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const signupEmail = `e2e-${Date.now()}@example.com`;
  const signupNickname = `e2e-${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('GET /api/v1 요청에 공통 성공 응답을 반환한다', () => {
    return request(app.getHttpServer()).get('/api/v1').expect(200).expect({
      success: true,
      statusCode: 200,
      data: 'Hello World!',
    });
  });

  it('POST /api/v1/auth/signup 요청으로 회원을 생성한다', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: signupEmail.toUpperCase(),
        password: 'password1234',
        nickname: ` ${signupNickname} `,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      data: {
        email: signupEmail,
        nickname: signupNickname,
        avatarUrl: null,
      },
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });

  it('중복 이메일로 회원가입하면 409 오류를 반환한다', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: signupEmail,
        password: 'password1234',
        nickname: `${signupNickname}-duplicate`,
      })
      .expect(409)
      .expect({
        success: false,
        statusCode: 409,
        error: {
          code: 'AUTH_EMAIL_ALREADY_EXISTS',
          message: '이미 사용 중인 이메일입니다.',
        },
      });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: signupEmail,
      },
    });
    await app.close();
  });
});
