import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../../../common/auth/interfaces/authenticated-user.interface';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let assertNotRevoked: ReturnType<typeof vi.fn>;
  let getActiveUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    assertNotRevoked = vi.fn().mockResolvedValue(undefined);
    getActiveUser = vi.fn();
    strategy = new JwtStrategy(
      { getOrThrow: vi.fn().mockReturnValue('secret-secret-secret-secret-secret-32') } as never,
      { extractAccessToken: vi.fn() } as never,
      { assertNotRevoked } as never,
      { getActiveUser } as never,
    );
  });

  it('rejects non-access tokens', async () => {
    const refreshLikePayload = {
      sub: 'u1',
      email: 'a@b.c',
      type: 'refresh',
      jti: 'j1',
      iat: 1,
    } as unknown as JwtPayload;

    await expect(strategy.validate(refreshLikePayload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns the cached active user after deny checks', async () => {
    getActiveUser.mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'Ann' });

    await expect(
      strategy.validate({
        sub: 'u1',
        email: 'a@b.c',
        type: 'access',
        jti: 'j1',
        iat: 1,
      }),
    ).resolves.toEqual({ id: 'u1', email: 'a@b.c', name: 'Ann' });

    expect(assertNotRevoked).toHaveBeenCalled();
    expect(getActiveUser).toHaveBeenCalledWith('u1');
  });

  it('rejects when the user is missing', async () => {
    getActiveUser.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'missing',
        email: 'a@b.c',
        type: 'access',
        jti: 'j1',
        iat: 1,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
