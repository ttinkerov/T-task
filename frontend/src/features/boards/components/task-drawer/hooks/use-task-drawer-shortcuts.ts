'use client';

import { useMeQuery } from '@/features/auth/hooks';
import { useShortcutHandlers } from '@/features/shell/hooks/use-shortcut-handlers';

export function useTaskDrawerShortcuts({
  setAssigneeId,
  assignMe,
}: {
  setAssigneeId: (id: string) => void;
  assignMe: (userId: string) => Promise<unknown>;
}) {
  const { data: session } = useMeQuery();

  useShortcutHandlers({
    'assign-me': () => {
      const myId = session?.user.id;
      if (!myId) return;
      setAssigneeId(myId);
      void assignMe(myId);
    },
    'focus-comment': () => {
      document.getElementById('task-comment-input')?.focus();
    },
  });
}
