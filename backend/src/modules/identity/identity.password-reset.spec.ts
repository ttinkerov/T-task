import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { DomainEvents } from '../../common/events/domain-events';
import { hashToken } from '../../common/auth/utils/token.util';
import { IdentityService } from './identity.service';

describe('IdentityService password reset', () => {
  const prisma = {
    user: { findFirst: vi.fn(), update: vi.fn() },
    passwordResetToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refreshSession: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const eventEmitter = { emit: vi.fn(), emitAsync: vi.fn() };
  const authUserCache = { invalidate: vi.fn() };

  let service: IdentityService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new IdentityService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      authUserCache as never,
      eventEmitter as never,
    );
  });

  // ── requestPasswordReset ─────────────────────────────────────────────────

  it('requestPasswordReset always accepts and does not leak missing users', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    const result = await service.requestPasswordReset({ email: 'missing@example.com' });
    expect(result).toEqual({ accepted: true });
    expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
  });

  it('requestPasswordReset emits mail event for existing users', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
    });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 't1' });
    eventEmitter.emitAsync.mockResolvedValue([]);

    const result = await service.requestPasswordReset({ email: 'User@example.com' });
    expect(result).toEqual({ accepted: true });
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      DomainEvents.PASSWORD_RESET_REQUESTED,
      expect.objectContaining({
        email: 'user@example.com',
        name: 'User',
        token: expect.any(String),
      }),
    );
  });

  it('requestPasswordReset invalidates token and still returns accepted when mail send fails', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u2',
      email: 'user2@example.com',
      name: 'User2',
    });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 't2' });
    // Simulate mail failure: emitAsync rejects (listener threw)
    eventEmitter.emitAsync.mockRejectedValue(new Error('SMTP failure'));

    const result = await service.requestPasswordReset({ email: 'user2@example.com' });

    expect(result).toEqual({ accepted: true });
    // Token should be invalidated (updateMany called a second time to mark usedAt)
    const updateManyCalls = prisma.passwordResetToken.updateMany.mock.calls;
    const invalidationCall = updateManyCalls.find(
      (call) => call[0]?.data?.usedAt instanceof Date && call[0]?.where?.userId === 'u2',
    );
    expect(invalidationCall).toBeDefined();
  });

  it('requestPasswordReset invalidates token when SMTP is not configured (send returns false without throwing)', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u3',
      email: 'user3@example.com',
      name: 'User3',
    });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 't3' });
    // onPasswordReset throws when mail.send returns false
    eventEmitter.emitAsync.mockRejectedValue(new Error('Mail not configured'));

    const result = await service.requestPasswordReset({ email: 'user3@example.com' });

    expect(result).toEqual({ accepted: true });
    const updateManyCalls = prisma.passwordResetToken.updateMany.mock.calls;
    const invalidationCall = updateManyCalls.find(
      (call) => call[0]?.data?.usedAt instanceof Date && call[0]?.where?.userId === 'u3',
    );
    expect(invalidationCall).toBeDefined();
  });

  // ── resetPassword ────────────────────────────────────────────────────────

  it('resetPassword rejects invalid tokens', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(
      service.resetPassword({ token: 'a'.repeat(32), password: 'Password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resetPassword updates password and revokes sessions', async () => {
    const raw = 'b'.repeat(32);
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'tok1',
      userId: 'u1',
      tokenHash: hashToken(raw),
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { deletedAt: null },
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    prisma.user.update.mockResolvedValue({});
    // First updateMany call = atomic token claim (returns count: 1 = success)
    // Second updateMany call = revoke other pending tokens (returns count: 0)
    prisma.passwordResetToken.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    prisma.refreshSession.updateMany.mockResolvedValue({ count: 1 });
    authUserCache.invalidate.mockResolvedValue(undefined);

    const result = await service.resetPassword({ token: raw, password: 'Password1' });
    expect(result).toEqual({ reset: true });
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.refreshSession.updateMany).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(DomainEvents.USER_ACCESS_REVOKED, {
      userId: 'u1',
    });
  });

  it('resetPassword rejects concurrent reuse (TOCTOU protection)', async () => {
    const raw = 'c'.repeat(32);
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'tok2',
      userId: 'u2',
      tokenHash: hashToken(raw),
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { deletedAt: null },
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    // Simulate concurrent use: atomic claim returns count 0 (another request already used the token)
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.resetPassword({ token: raw, password: 'Password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    // Password must NOT be updated
    expect(prisma.user.update).not.toHaveBeenCalled();
    // Sessions must NOT be revoked
    expect(prisma.refreshSession.updateMany).not.toHaveBeenCalled();
  });
});

// ── Rate-limit configs ───────────────────────────────────────────────────────

describe('password reset rate-limit configs', () => {
  it('forgot-password has its own keyPrefix and is stricter than login window', async () => {
    const { AUTH_FORGOT_PASSWORD_RATE_LIMIT } =
      await import('../../common/security/rate-limit.decorator');
    expect(AUTH_FORGOT_PASSWORD_RATE_LIMIT.keyPrefix).toBe('auth:forgot-password');
    expect(AUTH_FORGOT_PASSWORD_RATE_LIMIT.keyPrefix).not.toBe('auth:rate');
    expect(AUTH_FORGOT_PASSWORD_RATE_LIMIT.windowSeconds).toBeGreaterThanOrEqual(600);
    expect(AUTH_FORGOT_PASSWORD_RATE_LIMIT.maxAttempts).toBeLessThanOrEqual(10);
  });

  it('reset-password has its own distinct keyPrefix', async () => {
    const { AUTH_RESET_PASSWORD_RATE_LIMIT } =
      await import('../../common/security/rate-limit.decorator');
    expect(AUTH_RESET_PASSWORD_RATE_LIMIT.keyPrefix).toBe('auth:reset-password');
    expect(AUTH_RESET_PASSWORD_RATE_LIMIT.keyPrefix).not.toBe('auth:rate');
    expect(AUTH_RESET_PASSWORD_RATE_LIMIT.windowSeconds).toBeGreaterThanOrEqual(600);
  });
});
