'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskAiAssistantView from '@/vue/ai/TaskAiAssistant.vue';
import { useAiChatMutation, useAiSettingsQuery } from '../hooks';
import type { AiChatMessage, AiCitation } from '../types';

const QUICK_PROMPTS = [
  'Разбей на подзадачи',
  'Улучши формулировку названия и описания',
  'Какие риски и зависимости?',
  'Предложи критерии готовности',
];

export function TaskAiAssistant({
  workspaceId,
  taskId,
  taskTitle,
  taskDescription,
}: {
  workspaceId: string;
  taskId: string;
  taskTitle: string;
  taskDescription: string;
}) {
  const { data: settings } = useAiSettingsQuery(workspaceId);
  const chatMutation = useAiChatMutation(workspaceId);

  const onAsk = useCallback(
    async (messages: AiChatMessage[]) => {
      const result = await chatMutation.mutateAsync({
        mode: 'task',
        taskId,
        taskTitle,
        taskDescription,
        messages,
        useRag: true,
      });
      return {
        reply: result.reply,
        citations: (result.citations ?? []) as AiCitation[],
      };
    },
    [chatMutation, taskId, taskTitle, taskDescription],
  );

  const viewProps = useMemo(
    () => ({
      configured: Boolean(settings?.configured),
      isPending: chatMutation.isPending,
      quickPrompts: QUICK_PROMPTS,
      onAsk,
    }),
    [settings?.configured, chatMutation.isPending, onAsk],
  );

  if (!settings?.configured) {
    return null;
  }

  return <VueIsland component={TaskAiAssistantView} componentProps={viewProps} />;
}
