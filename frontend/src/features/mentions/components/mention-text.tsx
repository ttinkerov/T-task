'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import type { WorkspaceMember } from '@/features/workspaces/types';
import MentionTextView from '@/vue/mentions/MentionText.vue';
import { tokenizeMentions } from '../mention-utils';

interface MentionTextProps {
  text: string;
  members: WorkspaceMember[];
}

export function MentionText({ text, members }: MentionTextProps) {
  const tokens = useMemo(() => {
    const namesById = new Map(members.map((member) => [member.userId, member.user.name]));
    return tokenizeMentions(text).map((token, index) => {
      if (token.type === 'text') {
        return {
          key: `t-${index}-${token.value.slice(0, 8)}`,
          kind: 'text' as const,
          value: token.value,
        };
      }
      const currentName = namesById.get(token.userId);
      return {
        key: `m-${index}-${token.userId}`,
        kind: currentName ? ('mention' as const) : ('text' as const),
        value: currentName ? `@${currentName}` : token.value,
      };
    });
  }, [text, members]);

  const viewProps = useMemo(() => ({ tokens }), [tokens]);

  return <VueIsland component={MentionTextView} componentProps={viewProps} />;
}
