import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthUserCacheService, AUTH_USER_CACHE_TTL_SECONDS } from './auth-user-cache.service';

describe('AuthUserCacheService', () => {
  let get: ReturnType<typeof vi.fn>;
  let setex: ReturnType<typeof vi.fn>;
  let del: ReturnType<typeof vi.fn>;
  let findFirst: ReturnType<typeof vi.fn>;
  let service: AuthUserCacheService;

  beforeEach(() => {
    get = vi.fn();
    setex = vi.fn();
    del = vi.fn();
    findFirst = vi.fn();
    service = new AuthUserCacheService(
      { getClient: () => ({ get, setex, del }) } as never,
      { user: { findFirst } } as never,
    );
  });

  it('returns cached user without hitting the database', async () => {
    get.mockResolvedValue(JSON.stringify({ id: 'u1', email: 'a@b.c', name: 'Ann' }));

    const user = await service.getActiveUser('u1');

    expect(user).toEqual({ id: 'u1', email: 'a@b.c', name: 'Ann' });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('loads from database on miss and writes a short-lived cache entry', async () => {
    get.mockResolvedValue(null);
    findFirst.mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'Ann' });

    const user = await service.getActiveUser('u1');

    expect(user).toEqual({ id: 'u1', email: 'a@b.c', name: 'Ann' });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'u1', deletedAt: null },
      select: { id: true, email: true, name: true },
    });
    expect(setex).toHaveBeenCalledWith(
      'auth:user:u1',
      AUTH_USER_CACHE_TTL_SECONDS,
      JSON.stringify({ id: 'u1', email: 'a@b.c', name: 'Ann' }),
    );
  });

  it('falls through to the database when Redis read fails', async () => {
    get.mockRejectedValue(new Error('redis down'));
    findFirst.mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'Ann' });

    const user = await service.getActiveUser('u1');

    expect(user?.id).toBe('u1');
    expect(findFirst).toHaveBeenCalled();
  });

  it('returns null when the user is missing or soft-deleted', async () => {
    get.mockResolvedValue(null);
    findFirst.mockResolvedValue(null);

    await expect(service.getActiveUser('missing')).resolves.toBeNull();
    expect(setex).not.toHaveBeenCalled();
  });

  it('invalidates the cache key', async () => {
    await service.invalidate('u1');
    expect(del).toHaveBeenCalledWith('auth:user:u1');
  });
});
