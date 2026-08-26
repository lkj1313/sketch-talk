import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '@/app.module';
import { configureApp } from '@/app.setup';
import { PrismaService } from '@/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let loginRefreshCookie: string;
  let guestCookie: string;
  let joiningGuestCookie: string;
  let guestTokenHash: string | undefined;
  let joiningGuestTokenHash: string | undefined;
  let agent: ReturnType<typeof request.agent>;
  let guestAgent: ReturnType<typeof request.agent>;
  let joiningGuestAgent: ReturnType<typeof request.agent>;
  let serverUrl: string;
  let hostSocket: Socket;
  let joiningGuestSocket: Socket;
  let memberSocket: Socket;
  let publicRoomCode: string;
  let privateRoomCode: string;
  const createdRoomIds: string[] = [];
  const signupEmail = `e2e-${Date.now()}@example.com`;
  const signupNickname = `e2e-${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.listen(0);
    serverUrl = await app.getUrl();
    prisma = app.get(PrismaService);
    agent = request.agent(app.getHttpServer());
    guestAgent = request.agent(app.getHttpServer());
    joiningGuestAgent = request.agent(app.getHttpServer());
  });

  it('GET /api/v1 요청에 공통 성공 응답을 반환한다', () => {
    return request(app.getHttpServer()).get('/api/v1').expect(200).expect({
      success: true,
      statusCode: 200,
      data: 'Hello World!',
    });
  });

  it('인증 정보가 없는 WebSocket 연결을 거절한다', async () => {
    const socket = createRoomSocket(serverUrl);
    const error = await waitForSocketEvent<Error & { data?: unknown }>(
      socket,
      'connect_error',
    );

    expect(error.data).toEqual({
      code: 'AUTH_ACTOR_REQUIRED',
      message: '회원 Access Token 또는 비회원 Guest Token이 필요합니다.',
    });
    socket.disconnect();
  });

  it('POST /api/v1/guest-sessions 요청으로 비회원 세션을 발급한다', async () => {
    const response = await guestAgent
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
    const maxAge = Number(setCookie[0].match(/Max-Age=(\d+)/)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(86_390);
    expect(maxAge).toBeLessThanOrEqual(86_400);

    guestCookie = setCookie[0].split(';')[0];
    const guestToken = guestCookie.split('=')[1];
    guestTokenHash = createHash('sha256').update(guestToken).digest('hex');
    const savedSession = await prisma.guestSession.findUnique({
      where: {
        tokenHash: guestTokenHash,
      },
    });

    expect(savedSession).not.toBeNull();
    expect(savedSession?.tokenHash).not.toBe(guestToken);
  });

  it('비회원이 닉네임 없이 방을 생성하면 400 오류를 반환한다', () => {
    return guestAgent
      .post('/api/v1/rooms')
      .send({
        title: '게스트 방',
      })
      .expect(400)
      .expect({
        success: false,
        statusCode: 400,
        error: {
          code: 'ROOM_GUEST_NICKNAME_REQUIRED',
          message: '비회원은 닉네임이 필요합니다.',
        },
      });
  });

  it('비회원이 POST /api/v1/rooms 요청으로 방을 생성한다', async () => {
    const response = await guestAgent
      .post('/api/v1/rooms')
      .send({
        title: ' 게스트 방 ',
        nickname: ' 게스트123 ',
        maxPlayers: 6,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      data: {
        code: expect.stringMatching(/^[A-HJ-NP-Z2-9]{6}$/),
        title: '게스트 방',
        status: 'WAITING',
        visibility: 'PUBLIC',
        maxPlayers: 6,
        allowMidJoin: true,
        playerCount: 1,
        host: {
          nickname: '게스트123',
        },
      },
    });
    publicRoomCode = response.body.data.code as string;
    createdRoomIds.push(response.body.data.id as string);
  });

  it('비회원 WebSocket으로 참가 중인 방을 구독하고 현재 상태를 받는다', async () => {
    hostSocket = createRoomSocket(serverUrl, { cookie: guestCookie });
    await waitForSocketEvent(hostSocket, 'connect');

    const errorPromise = waitForSocketEvent<{
      code: string;
      message: string;
    }>(hostSocket, 'realtime:error');
    hostSocket.emit('room:subscribe', { code: 'wrong' });
    await expect(errorPromise).resolves.toEqual({
      code: 'REALTIME_INVALID_SUBSCRIBE_PAYLOAD',
      message: '올바른 6자리 방 코드가 필요합니다.',
    });

    const statePromise = waitForSocketEvent<{
      code: string;
      playerCount: number;
    }>(hostSocket, 'room:state');
    hostSocket.emit('room:subscribe', { code: publicRoomCode.toLowerCase() });

    await expect(statePromise).resolves.toMatchObject({
      code: publicRoomCode,
      playerCount: 1,
    });
  });

  it('방에 참가할 비회원 세션을 발급한다', async () => {
    const response = await joiningGuestAgent
      .post('/api/v1/guest-sessions')
      .expect(201);
    const setCookie = response.headers['set-cookie'] as string[];
    joiningGuestCookie = setCookie[0].split(';')[0];
    const guestToken = joiningGuestCookie.split('=')[1];

    joiningGuestTokenHash = createHash('sha256')
      .update(guestToken)
      .digest('hex');
  });

  it('참가하지 않은 비회원의 방 WebSocket 구독을 거절한다', async () => {
    joiningGuestSocket = createRoomSocket(serverUrl, {
      cookie: joiningGuestCookie,
    });
    await waitForSocketEvent(joiningGuestSocket, 'connect');

    const errorPromise = waitForSocketEvent<{
      code: string;
      message: string;
    }>(joiningGuestSocket, 'realtime:error');
    joiningGuestSocket.emit('room:subscribe', { code: publicRoomCode });

    await expect(errorPromise).resolves.toEqual({
      code: 'ROOM_PARTICIPANT_NOT_FOUND',
      message: '해당 방에 참가하고 있지 않습니다.',
    });
  });

  it('방에 참가하지 않은 비회원의 현재 참가자 정보는 null이다', () => {
    return joiningGuestAgent
      .get(`/api/v1/rooms/${publicRoomCode}/participants/me`)
      .expect(200)
      .expect({
        success: true,
        statusCode: 200,
        data: null,
      });
  });

  it('비회원이 닉네임 없이 방에 참가하면 400 오류를 반환한다', () => {
    return joiningGuestAgent
      .post(`/api/v1/rooms/${publicRoomCode}/participants`)
      .send({})
      .expect(400)
      .expect({
        success: false,
        statusCode: 400,
        error: {
          code: 'ROOM_GUEST_NICKNAME_REQUIRED',
          message: '비회원은 닉네임이 필요합니다.',
        },
      });
  });

  it('비회원이 초대 코드와 닉네임으로 방에 참가한다', async () => {
    const joinedEventPromise = waitForSocketEvent<{
      roomCode: string;
      participant: { nickname: string };
      playerCount: number;
    }>(hostSocket, 'room:participant-joined');
    const response = await joiningGuestAgent
      .post(`/api/v1/rooms/${publicRoomCode.toLowerCase()}/participants`)
      .send({ nickname: ' 참가자123 ' })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      data: {
        room: {
          code: publicRoomCode,
          playerCount: 2,
          participants: expect.arrayContaining([
            expect.objectContaining({
              nickname: '참가자123',
              isHost: false,
            }),
          ]),
        },
        participant: {
          nickname: '참가자123',
          score: 0,
          isReady: false,
          isHost: false,
        },
      },
    });
    await expect(joinedEventPromise).resolves.toMatchObject({
      roomCode: publicRoomCode,
      participant: {
        nickname: '참가자123',
      },
      playerCount: 2,
    });

    const statePromise = waitForSocketEvent<{
      code: string;
      playerCount: number;
    }>(joiningGuestSocket, 'room:state');
    joiningGuestSocket.emit('room:subscribe', { code: publicRoomCode });
    await expect(statePromise).resolves.toMatchObject({
      code: publicRoomCode,
      playerCount: 2,
    });
  });

  it('방에 참가한 비회원의 현재 참가자 정보를 조회한다', async () => {
    const response = await joiningGuestAgent
      .get(`/api/v1/rooms/${publicRoomCode}/participants/me`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      data: {
        nickname: '참가자123',
        score: 0,
        isReady: false,
        isHost: false,
      },
    });
  });

  it('이미 방에 참가한 비회원의 중복 참가를 거절한다', () => {
    return joiningGuestAgent
      .post(`/api/v1/rooms/${publicRoomCode}/participants`)
      .send({ nickname: '다른닉네임' })
      .expect(409)
      .expect({
        success: false,
        statusCode: 409,
        error: {
          code: 'ROOM_ALREADY_IN_ROOM',
          message: '이미 다른 방에 참가 중입니다.',
        },
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

  it('회원이 POST /api/v1/rooms 요청으로 방을 생성한다', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: ' 회원 방 ',
        nickname: '사용되지 않는 닉네임',
        visibility: 'PRIVATE',
        maxPlayers: 10,
        allowMidJoin: false,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      data: {
        code: expect.stringMatching(/^[A-HJ-NP-Z2-9]{6}$/),
        title: '회원 방',
        status: 'WAITING',
        visibility: 'PRIVATE',
        maxPlayers: 10,
        allowMidJoin: false,
        playerCount: 1,
        host: {
          nickname: signupNickname,
        },
      },
    });
    privateRoomCode = response.body.data.code as string;
    createdRoomIds.push(response.body.data.id as string);
  });

  it('회원 Access Token으로 WebSocket에 연결하고 방을 구독한다', async () => {
    memberSocket = createRoomSocket(serverUrl, { accessToken });
    await waitForSocketEvent(memberSocket, 'connect');

    const statePromise = waitForSocketEvent<{
      code: string;
      playerCount: number;
    }>(memberSocket, 'room:state');
    memberSocket.emit('room:subscribe', { code: privateRoomCode });

    await expect(statePromise).resolves.toMatchObject({
      code: privateRoomCode,
      playerCount: 1,
    });
  });

  it('이미 방에 참가 중인 회원이 방을 생성하면 409 오류를 반환한다', () => {
    return request(app.getHttpServer())
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '중복 방',
      })
      .expect(409)
      .expect({
        success: false,
        statusCode: 409,
        error: {
          code: 'ROOM_ALREADY_IN_ROOM',
          message: '이미 다른 방에 참가 중입니다.',
        },
      });
  });

  it('GET /api/v1/rooms 요청으로 공개 방 목록만 조회한다', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/rooms')
      .query({ page: 1, pageSize: 20, status: 'WAITING' })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      meta: {
        page: 1,
        pageSize: 20,
        hasNext: false,
      },
    });
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: publicRoomCode,
          visibility: 'PUBLIC',
          playerCount: 2,
        }),
      ]),
    );
    expect(
      response.body.data.some(
        (room: { code: string }) => room.code === privateRoomCode,
      ),
    ).toBe(false);
  });

  it('GET /api/v1/rooms/:code 요청으로 비공개 방도 상세 조회한다', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/rooms/${privateRoomCode.toLowerCase()}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      data: {
        code: privateRoomCode,
        visibility: 'PRIVATE',
        playerCount: 1,
        host: {
          nickname: signupNickname,
        },
        participants: [
          {
            nickname: signupNickname,
            score: 0,
            isReady: false,
            isHost: true,
          },
        ],
      },
    });
  });

  it('존재하지 않는 방 코드를 조회하면 404 오류를 반환한다', () => {
    return request(app.getHttpServer())
      .get('/api/v1/rooms/ZZZZZZ')
      .expect(404)
      .expect({
        success: false,
        statusCode: 404,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: '방을 찾을 수 없습니다.',
        },
      });
  });

  it('일반 참가자가 준비 상태를 변경한다', async () => {
    const readyEventPromise = waitForSocketEvent<{
      roomCode: string;
      participant: { nickname: string; isReady: boolean };
    }>(hostSocket, 'room:ready-changed');
    await joiningGuestAgent
      .patch(`/api/v1/rooms/${publicRoomCode}/participants/me/ready`)
      .send({ isReady: true })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          success: true,
          statusCode: 200,
          data: {
            nickname: '참가자123',
            isReady: true,
            isHost: false,
          },
        });
      });
    await expect(readyEventPromise).resolves.toMatchObject({
      roomCode: publicRoomCode,
      participant: {
        nickname: '참가자123',
        isReady: true,
      },
    });

    await joiningGuestAgent
      .patch(`/api/v1/rooms/${publicRoomCode}/participants/me/ready`)
      .send({ isReady: false })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.isReady).toBe(false);
      });
  });

  it('방장은 준비 상태를 변경할 수 없다', () => {
    return guestAgent
      .patch(`/api/v1/rooms/${publicRoomCode}/participants/me/ready`)
      .send({ isReady: true })
      .expect(403)
      .expect({
        success: false,
        statusCode: 403,
        error: {
          code: 'ROOM_HOST_READY_NOT_ALLOWED',
          message: '방장은 준비 상태를 변경할 수 없습니다.',
        },
      });
  });

  it('준비 상태가 boolean이 아니면 400 오류를 반환한다', () => {
    return joiningGuestAgent
      .patch(`/api/v1/rooms/${publicRoomCode}/participants/me/ready`)
      .send({ isReady: 'true' })
      .expect(400);
  });

  it('참가자가 1명인 방은 게임을 시작할 수 없다', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/rooms/${privateRoomCode}/start`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)
      .expect({
        success: false,
        statusCode: 409,
        error: {
          code: 'ROOM_NOT_ENOUGH_PARTICIPANTS',
          message: '게임을 시작하려면 참가자가 2명 이상이어야 합니다.',
        },
      });
  });

  it('준비하지 않은 참가자가 있으면 게임을 시작할 수 없다', () => {
    return guestAgent
      .post(`/api/v1/rooms/${publicRoomCode}/start`)
      .expect(409)
      .expect({
        success: false,
        statusCode: 409,
        error: {
          code: 'ROOM_PARTICIPANTS_NOT_READY',
          message: '아직 준비하지 않은 참가자가 있습니다.',
        },
      });
  });

  it('일반 참가자는 게임을 시작할 수 없다', () => {
    return joiningGuestAgent
      .post(`/api/v1/rooms/${publicRoomCode}/start`)
      .expect(403)
      .expect({
        success: false,
        statusCode: 403,
        error: {
          code: 'ROOM_ONLY_HOST_CAN_START',
          message: '방장만 게임을 시작할 수 있습니다.',
        },
      });
  });

  it('모든 참가자가 준비되면 방장이 게임을 시작한다', async () => {
    await joiningGuestAgent
      .patch(`/api/v1/rooms/${publicRoomCode}/participants/me/ready`)
      .send({ isReady: true })
      .expect(200);

    const gameStartedPromise = waitForSocketEvent<{
      roomCode: string;
      room: { status: string };
    }>(joiningGuestSocket, 'room:game-started');
    await guestAgent
      .post(`/api/v1/rooms/${publicRoomCode.toLowerCase()}/start`)
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          success: true,
          statusCode: 201,
          data: {
            code: publicRoomCode,
            status: 'PLAYING',
            playerCount: 2,
          },
        });
      });
    await expect(gameStartedPromise).resolves.toMatchObject({
      roomCode: publicRoomCode,
      room: {
        status: 'PLAYING',
      },
    });
  });

  it('이미 시작된 방은 다시 시작할 수 없다', () => {
    return guestAgent
      .post(`/api/v1/rooms/${publicRoomCode}/start`)
      .expect(409)
      .expect({
        success: false,
        statusCode: 409,
        error: {
          code: 'ROOM_START_NOT_ALLOWED',
          message: '대기 중인 방만 게임을 시작할 수 있습니다.',
        },
      });
  });

  it('방장이 나가면 남은 참가자에게 방장을 넘긴다', async () => {
    const leftEventPromise = waitForSocketEvent<{
      participantId: string;
      playerCount: number;
    }>(joiningGuestSocket, 'room:participant-left');
    const hostChangedPromise = waitForSocketEvent<{
      host: { nickname: string };
    }>(joiningGuestSocket, 'room:host-changed');
    await guestAgent
      .delete(`/api/v1/rooms/${publicRoomCode.toLowerCase()}/participants/me`)
      .expect(200)
      .expect({
        success: true,
        statusCode: 200,
        data: null,
      });

    await expect(leftEventPromise).resolves.toMatchObject({
      playerCount: 1,
    });
    await expect(hostChangedPromise).resolves.toMatchObject({
      host: {
        nickname: '참가자123',
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/api/v1/rooms/${publicRoomCode}`)
      .expect(200);

    expect(response.body).toMatchObject({
      data: {
        playerCount: 1,
        host: {
          nickname: '참가자123',
        },
        participants: [
          {
            nickname: '참가자123',
            isHost: true,
          },
        ],
      },
    });
  });

  it('이미 나간 사용자가 다시 나가기를 요청하면 404 오류를 반환한다', () => {
    return guestAgent
      .delete(`/api/v1/rooms/${publicRoomCode}/participants/me`)
      .expect(404)
      .expect({
        success: false,
        statusCode: 404,
        error: {
          code: 'ROOM_PARTICIPANT_NOT_FOUND',
          message: '해당 방에 참가하고 있지 않습니다.',
        },
      });
  });

  it('마지막 참가자가 나가면 방을 삭제한다', async () => {
    await joiningGuestAgent
      .delete(`/api/v1/rooms/${publicRoomCode}/participants/me`)
      .expect(200)
      .expect({
        success: true,
        statusCode: 200,
        data: null,
      });

    await request(app.getHttpServer())
      .get(`/api/v1/rooms/${publicRoomCode}`)
      .expect(404);
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
    hostSocket?.disconnect();
    joiningGuestSocket?.disconnect();
    memberSocket?.disconnect();
    await prisma.room.deleteMany({
      where: {
        id: {
          in: createdRoomIds,
        },
      },
    });
    if (guestTokenHash || joiningGuestTokenHash) {
      await prisma.guestSession.deleteMany({
        where: {
          tokenHash: {
            in: [guestTokenHash, joiningGuestTokenHash].filter(
              (value): value is string => value !== undefined,
            ),
          },
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

function createRoomSocket(
  serverUrl: string,
  options: {
    accessToken?: string;
    cookie?: string;
  } = {},
): Socket {
  return io(`${serverUrl}/rooms`, {
    path: '/api/v1/socket.io',
    transports: ['websocket'],
    autoConnect: false,
    forceNew: true,
    reconnection: false,
    auth: options.accessToken
      ? { accessToken: options.accessToken }
      : undefined,
    extraHeaders: options.cookie ? { Cookie: options.cookie } : undefined,
  });
}

function waitForSocketEvent<T = unknown>(
  socket: Socket,
  event: string,
  timeoutMs = 5000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(event, handleEvent);
      reject(new Error(`${event} 이벤트를 기다리는 중 시간 초과되었습니다.`));
    }, timeoutMs);
    const handleEvent = (data: T) => {
      clearTimeout(timeout);
      resolve(data);
    };

    socket.once(event, handleEvent);

    if (!socket.connected && !socket.active) {
      socket.connect();
    }
  });
}
