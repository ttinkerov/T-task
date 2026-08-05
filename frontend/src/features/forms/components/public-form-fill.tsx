'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import PublicFormFillView from '@/vue/forms/PublicFormFill.vue';
import { usePublicFormQuery, useSubmitPublicFormMutation } from '../hooks';

export function PublicFormFill({ token }: { token: string }) {
  const { data: form, isLoading, isError } = usePublicFormQuery(token);
  const submitMutation = useSubmitPublicFormMutation(token);

  const onSubmit = useCallback(
    async (answers: Record<string, string | string[]>) => {
      await submitMutation.mutateAsync(answers);
    },
    [submitMutation],
  );

  const fillProps = useMemo(
    () => ({
      form: form ?? null,
      isLoading,
      isError,
      isPending: submitMutation.isPending,
      errorMessage: submitMutation.error?.message ?? '',
      onSubmit,
    }),
    [form, isLoading, isError, submitMutation.isPending, submitMutation.error, onSubmit],
  );

  return <VueIsland component={PublicFormFillView} componentProps={fillProps} />;
}
