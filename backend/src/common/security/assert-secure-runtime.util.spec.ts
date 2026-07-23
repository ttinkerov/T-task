import { describe, expect, it } from 'vitest';
import { assertSecureRuntime } from './assert-secure-runtime.util';

describe('assertSecureRuntime', () => {
  it('allows production and test without opt-in', () => {
    expect(() => assertSecureRuntime('production')).not.toThrow();
    expect(() => assertSecureRuntime('test')).not.toThrow();
  });

  it('allows development when ALLOW_INSECURE_DEV is true', () => {
    const previous = process.env.ALLOW_INSECURE_DEV;
    process.env.ALLOW_INSECURE_DEV = 'true';
    try {
      expect(() => assertSecureRuntime('development')).not.toThrow();
    } finally {
      if (previous === undefined) {
        delete process.env.ALLOW_INSECURE_DEV;
      } else {
        process.env.ALLOW_INSECURE_DEV = previous;
      }
    }
  });

  it('allows development outside Docker (no /.dockerenv on host)', () => {
    const previous = process.env.ALLOW_INSECURE_DEV;
    delete process.env.ALLOW_INSECURE_DEV;
    try {
      expect(() => assertSecureRuntime('development')).not.toThrow();
    } finally {
      if (previous !== undefined) {
        process.env.ALLOW_INSECURE_DEV = previous;
      }
    }
  });
});
