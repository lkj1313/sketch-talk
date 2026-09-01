import { getWebOrigins } from '@/app.setup';

describe('getWebOrigins', () => {
  const originalWebOrigin = process.env.WEB_ORIGIN;

  afterEach(() => {
    if (originalWebOrigin === undefined) {
      delete process.env.WEB_ORIGIN;
      return;
    }

    process.env.WEB_ORIGIN = originalWebOrigin;
  });

  it('설정이 없으면 로컬 웹 주소를 사용한다', () => {
    delete process.env.WEB_ORIGIN;

    expect(getWebOrigins()).toEqual(['http://localhost:5173']);
  });

  it('쉼표로 구분된 여러 웹 주소를 정리한다', () => {
    process.env.WEB_ORIGIN =
      'http://localhost:5173, http://127.0.0.1:5174, ';

    expect(getWebOrigins()).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5174',
    ]);
  });
});
