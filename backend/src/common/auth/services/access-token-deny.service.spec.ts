import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessTokenDenyService } from './access-token-deny.service';

describe('AccessTokenDenyService', () => {
  let get: ReturnType<typeof vi.fn>;
  let setex: ReturnType<typeof vi.fn>;
  let service: AccessTokenDenyService;

  beforeEach(() => {
    get = vi.fn();
    setex = vi.fn();
    service = new AccessTokenDenyService({
      getClient: () => ({ get, setex }),
    } as never);
  });

  it('revokes a jti with ttl', async () => {
    await service.revokeJti('jti-1', 120);
    expect(setex).toHaveBeenCalledWith('access:deny:jti:jti-1', 120, '1');
  });

  it('rejects denylisted jti', async () => {
    get.mockResolvedValueOnce('1');
    await expect(
      service.assertNotRevoked({
        sub: 'u1',
        email: 'a@b.c',
        type: 'access',
        jti: 'jti-1',
        iat: 100,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects tokens issued before user revoke epoch', async () => {
    get.mockResolvedValueOnce(null).mockResolvedValueOnce('200');
    await expect(
      service.assertNotRevoked({
        sub: 'u1',
        email: 'a@b.c',
        type: 'access',
        jti: 'jti-2',
        iat: 150,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows fresh tokens after user revoke epoch', async () => {
    get.mockResolvedValueOnce(null).mockResolvedValueOnce('200');
    await expect(
      service.assertNotRevoked({
        sub: 'u1',
        email: 'a@b.c',
        type: 'access',
        jti: 'jti-3',
        iat: 250,
      }),
    ).resolves.toBeUndefined();
  });

  it('soft-fails when Redis is unavailable during assert', async () => {
    get.mockRejectedValueOnce(new Error('redis down'));
    await expect(
      service.assertNotRevoked({
        sub: 'u1',
        email: 'a@b.c',
        type: 'access',
        jti: 'jti-4',
        iat: 100,
      }),
    ).resolves.toBeUndefined();
  });

  it('surfaces revoke failures instead of silently succeeding', async () => {
    setex.mockRejectedValueOnce(new Error('redis down'));
    await expect(service.revokeJti('jti-1', 120)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
