import { HttpException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let incr: ReturnType<typeof vi.fn>;
  let expire: ReturnType<typeof vi.fn>;
  let service: RateLimitService;

  beforeEach(() => {
    incr = vi.fn();
    expire = vi.fn();
    service = new RateLimitService({
      getClient: () => ({ incr, expire }),
    } as never);
  });

  it('allows requests under the max', async () => {
    incr.mockResolvedValue(3);
    await expect(
      service.consume('param:token:abc', {
        keyPrefix: 'public-form:submit',
        windowSeconds: 60,
        maxAttempts: 10,
      }),
    ).resolves.toBeUndefined();
    expect(incr).toHaveBeenCalledWith('public-form:submit:param:token:abc');
  });

  it('throws 429 when over budget', async () => {
    incr.mockResolvedValue(11);
    await expect(
      service.consume('ws:workspace-1', {
        keyPrefix: 'public-form:submit-ws',
        windowSeconds: 60,
        maxAttempts: 10,
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('falls back to memory when Redis fails', async () => {
    incr.mockRejectedValue(new Error('redis down'));
    const config = {
      keyPrefix: 'public-form:submit-ws',
      windowSeconds: 60,
      maxAttempts: 2,
    };

    await service.consume('ws:1', config);
    await service.consume('ws:1', config);
    await expect(service.consume('ws:1', config)).rejects.toBeInstanceOf(HttpException);
  });
});
