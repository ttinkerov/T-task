'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import AiChatPanelView from '@/vue/ai/AiChatPanel.vue';
import { useAiChatMutation, useAiSettingsQuery } from '../hooks';
import type { AiChatMessage, AiCitation } from '../types';

export function AiChatPanel({ workspaceId }: { workspaceId: string }) {
  const { data: settings, isLoading } = useAiSettingsQuery(workspaceId);
  const chatMutation = useAiChatMutation(workspaceId);

  const onSend = useCallback(
    async (messages: AiChatMessage[]) => {
      const result = await chatMutation.mutateAsync({
        mode: 'chat',
        messages,
        useRag: true,
      });
      return {
        reply: result.reply,
        citations: (result.citations ?? []) as AiCitation[],
      };
    },
    [chatMutation],
  );

  const viewProps = useMemo(
    () => ({
      isLoading,
      configured: Boolean(settings?.configured),
      provider: settings?.provider ?? '',
      model: settings?.model ?? '',
      settingsHref: `/dashboard/workspaces/${workspaceId}/settings`,
      isPending: chatMutation.isPending,
      onSend,
    }),
    [
      isLoading,
      settings?.configured,
      settings?.provider,
      settings?.model,
      workspaceId,
      chatMutation.isPending,
      onSend,
    ],
  );

  return <VueIsland component={AiChatPanelView} componentProps={viewProps} />;
}
