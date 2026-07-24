import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { configureApp } from '@/app.setup';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET / 요청에 공통 성공 응답을 반환한다', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect({
      success: true,
      statusCode: 200,
      data: 'Hello World!',
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
