import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forgotPassword, getMe, login, logout, register, resetPassword } from './api';
import type { LoginPayload, RegisterPayload } from './types';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await getMe();
      return response.data;
    },
    enabled,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await login(payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await register(payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(authKeys.me(), {
          user: data.user,
          workspaces: [],
        });
      }
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const response = await forgotPassword(payload);
      return response.data;
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      const response = await resetPassword(payload);
      return response.data;
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.clear();
    },
  });
}
