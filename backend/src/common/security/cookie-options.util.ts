import { CookieOptions } from 'express';

export function buildAccessCookieOptions(maxAgeMs: number, isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function buildRefreshCookieOptions(maxAgeMs: number, isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: maxAgeMs,
  };
}

export function buildAccessCookieClearOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  };
}

export function buildRefreshCookieClearOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth',
  };
}

/** @deprecated Use buildAccessCookieOptions / buildRefreshCookieOptions. */
export function buildAuthCookieOptions(maxAgeMs: number, isProduction: boolean): CookieOptions {
  return buildAccessCookieOptions(maxAgeMs, isProduction);
}

/** @deprecated Use path-specific clear helpers. */
export function buildAuthCookieClearOptions(isProduction: boolean): CookieOptions {
  return buildAccessCookieClearOptions(isProduction);
}
