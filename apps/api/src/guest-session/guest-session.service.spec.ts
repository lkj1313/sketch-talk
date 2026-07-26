import { PrismaService } from '@/prisma/prisma.service';
import { GuestSessionService } from '@/guest-session/guest-session.service';

describe('GuestSessionService', () => {
  const guestSessionCreate = jest.fn();
  const prisma = {
    guestSession: {
      create: guestSessionCreate,
    },
  } as unknown as PrismaService;
  const guestSessionService = new GuestSessionService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    guestSessionCreate.mockResolvedValue({});
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
});
