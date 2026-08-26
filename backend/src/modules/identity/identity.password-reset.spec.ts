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
  const eventEmitter = { emit: vi.fn() };
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

  it('requestPasswordReset always accepts and does not leak missing users', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    const result = await service.requestPasswordReset({ email: 'missing@example.com' });
    expect(result).toEqual({ accepted: true });
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('requestPasswordReset emits mail event for existing users', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
    });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 't1' });

    const result = await service.requestPasswordReset({ email: 'User@example.com' });
    expect(result).toEqual({ accepted: true });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      DomainEvents.PASSWORD_RESET_REQUESTED,
      expect.objectContaining({
        email: 'user@example.com',
        name: 'User',
        token: expect.any(String),
      }),
    );
  });

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
    prisma.passwordResetToken.update.mockResolvedValue({});
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
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
});
