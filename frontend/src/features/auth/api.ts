import { apiFetch } from '@/shared/api/client';
import type { AuthSession, LoginPayload, RegisterPayload } from './types';

export async function register(payload: RegisterPayload) {
  return apiFetch<{ user: AuthSession['user'] }>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload) {
  return apiFetch<AuthSession>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(payload: { email: string }) {
  return apiFetch<{ accepted: boolean }>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: { token: string; password: string }) {
  return apiFetch<{ reset: boolean }>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function refreshSession() {
  return apiFetch<AuthSession>('/api/v1/auth/refresh', {
    method: 'POST',
  });
}

export async function logout() {
  return apiFetch<{ success: boolean }>('/api/v1/auth/logout', {
    method: 'POST',
  });
}

export async function logoutAll() {
  return apiFetch<{ success: boolean }>('/api/v1/auth/logout-all', {
    method: 'POST',
  });
}

export async function getMe() {
  return apiFetch<AuthSession>('/api/v1/auth/me');
}
