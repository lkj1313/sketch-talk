import { PrismaService } from '@/prisma/prisma.service';
import { GuestSessionService } from '@/guest-session/guest-session.service';

describe('GuestSessionService', () => {
  const guestSessionCreate = jest.fn();
  const guestSessionFindUnique = jest.fn();
  const prisma = {
    guestSession: {
      create: guestSessionCreate,
      findUnique: guestSessionFindUnique,
    },
  } as unknown as PrismaService;
  const guestSessionService = new GuestSessionService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    guestSessionCreate.mockResolvedValue({});
    guestSessionFindUnique.mockResolvedValue(null);
  });

  it('Guest Token의 해시와 만료 시간을 저장하고 원본 토큰을 반환한다', async () => {
    const result = await guestSessionService.issue();

    expect(result.guestToken).toEqual(expect.any(String));
    expect(result.guestToken).toHaveLength(64);
    expect(result.result.expiresAt).toEqual(expect.any(String));
    expect(guestSessionCreate).toHaveBeenCalledWith({
      data: {
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      },
    });
    expect(guestSessionCreate.mock.calls[0][0].data.tokenHash).not.toBe(
      result.guestToken,
    );
  });

  it('유효한 Guest Token이면 기존 세션을 재사용한다', async () => {
    const guestToken = 'a'.repeat(64);
    const expiresAt = new Date('2099-01-01T00:00:00.000Z');
    guestSessionFindUnique.mockResolvedValue({ expiresAt });

    const result = await guestSessionService.issue(guestToken);

    expect(result).toEqual({
      result: {
        expiresAt: expiresAt.toISOString(),
      },
      guestToken,
    });
    expect(guestSessionFindUnique).toHaveBeenCalledWith({
      where: {
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
      select: {
        expiresAt: true,
      },
    });
    expect(guestSessionCreate).not.toHaveBeenCalled();
  });

  it('존재하지 않는 Guest Token이면 새 세션을 발급한다', async () => {
    const result = await guestSessionService.issue('invalid-guest-token');

    expect(result.guestToken).not.toBe('invalid-guest-token');
    expect(guestSessionCreate).toHaveBeenCalledTimes(1);
  });

  it('만료된 Guest Token이면 새 세션을 발급한다', async () => {
    const guestToken = 'b'.repeat(64);
    guestSessionFindUnique.mockResolvedValue({
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    const result = await guestSessionService.issue(guestToken);

    expect(result.guestToken).not.toBe(guestToken);
    expect(guestSessionCreate).toHaveBeenCalledTimes(1);
  });
});
