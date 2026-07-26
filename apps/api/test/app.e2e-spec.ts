import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { configureApp } from '@/app.setup';
import { PrismaService } from '@/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let loginRefreshCookie: string;
  let guestTokenHash: string | undefined;
  let agent: ReturnType<typeof request.agent>;
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
    agent = request.agent(app.getHttpServer());
  });

  it('GET /api/v1 요청에 공통 성공 응답을 반환한다', () => {
    return request(app.getHttpServer()).get('/api/v1').expect(200).expect({
      success: true,
      statusCode: 200,
      data: 'Hello World!',
    });
  });

  it('POST /api/v1/guest-sessions 요청으로 비회원 세션을 발급한다', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/guest-sessions')
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      data: {
        expiresAt: expect.any(String),
      },
    });
    expect(response.body.data).not.toHaveProperty('guestToken');

    const setCookie = response.headers['set-cookie'] as string[];
    expect(setCookie[0]).toContain('guestToken=');
    expect(setCookie[0]).toContain('HttpOnly');
    expect(setCookie[0]).toContain('SameSite=Lax');
    expect(setCookie[0]).toContain('Path=/api/v1');
    expect(setCookie[0]).toContain('Max-Age=86400');

    const guestToken = setCookie[0].split(';')[0].split('=')[1];
    guestTokenHash = createHash('sha256').update(guestToken).digest('hex');
    const savedSession = await prisma.guestSession.findUnique({
      where: {
        tokenHash: guestTokenHash,
      },
    });

    expect(savedSession).not.toBeNull();
    expect(savedSession?.tokenHash).not.toBe(guestToken);
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

  it('POST /api/v1/auth/login 요청으로 로그인한다', async () => {
    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: signupEmail.toUpperCase(),
        password: 'password1234',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      data: {
        user: {
          email: signupEmail,
          nickname: signupNickname,
          avatarUrl: null,
        },
      },
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data).not.toHaveProperty('refreshToken');
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    const setCookie = response.headers['set-cookie'] as string[];
    expect(setCookie[0]).toContain('HttpOnly');
    expect(setCookie[0]).toContain('SameSite=Lax');
    expect(setCookie[0]).toContain('Path=/api/v1/auth');
    loginRefreshCookie = setCookie[0].split(';')[0];
    accessToken = response.body.data.accessToken as string;
  });

  it('POST /api/v1/auth/refresh 요청으로 토큰을 재발급한다', async () => {
    const response = await agent.post('/api/v1/auth/refresh').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      data: {
        accessToken: expect.any(String),
      },
    });
    expect(response.body.data).not.toHaveProperty('refreshToken');
    accessToken = response.body.data.accessToken as string;
  });

  it('회전으로 폐기된 Refresh Token은 다시 사용할 수 없다', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', loginRefreshCookie)
      .expect(401)
      .expect({
        success: false,
        statusCode: 401,
        error: {
          code: 'AUTH_INVALID_REFRESH_TOKEN',
          message: '유효하지 않거나 만료된 Refresh Token입니다.',
        },
      });
  });

  it('잘못된 비밀번호로 로그인하면 401 오류를 반환한다', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: signupEmail,
        password: 'wrong-password',
      })
      .expect(401)
      .expect({
        success: false,
        statusCode: 401,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        },
      });
  });

  it('유효한 Access Token으로 GET /api/v1/auth/me 요청 시 내 정보를 반환한다', () => {
    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          success: true,
          statusCode: 200,
          data: {
            email: signupEmail,
            nickname: signupNickname,
            avatarUrl: null,
          },
        });
        expect(response.body.data).not.toHaveProperty('passwordHash');
      });
  });

  it('Access Token 없이 내 정보를 요청하면 401 오류를 반환한다', () => {
    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401)
      .expect({
        success: false,
        statusCode: 401,
        error: {
          code: 'AUTH_ACCESS_TOKEN_REQUIRED',
          message: 'Access Token이 필요합니다.',
        },
      });
  });

  it('변조된 Access Token으로 내 정보를 요청하면 401 오류를 반환한다', () => {
    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}tampered`)
      .expect(401)
      .expect({
        success: false,
        statusCode: 401,
        error: {
          code: 'AUTH_INVALID_ACCESS_TOKEN',
          message: '유효하지 않거나 만료된 Access Token입니다.',
        },
      });
  });

  it('POST /api/v1/auth/logout 요청으로 세션과 쿠키를 폐기한다', async () => {
    await agent.post('/api/v1/auth/logout').expect(200).expect({
      success: true,
      statusCode: 200,
      data: null,
    });

    await agent
      .post('/api/v1/auth/refresh')
      .expect(401)
      .expect({
        success: false,
        statusCode: 401,
        error: {
          code: 'AUTH_REFRESH_TOKEN_REQUIRED',
          message: 'Refresh Token이 필요합니다.',
        },
      });
  });

  afterAll(async () => {
    if (guestTokenHash) {
      await prisma.guestSession.deleteMany({
        where: {
          tokenHash: guestTokenHash,
        },
      });
    }
    await prisma.user.deleteMany({
      where: {
        email: signupEmail,
      },
    });
    await app.close();
  });
});
