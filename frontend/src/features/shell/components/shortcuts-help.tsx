'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import ShortcutsHelpView from '@/vue/shell/ShortcutsHelp.vue';
import { SHORTCUTS } from '../lib/shortcuts';

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const viewProps = useMemo(
    () => ({
      open,
      entries: SHORTCUTS.map((shortcut) => ({
        id: shortcut.id,
        label: shortcut.label,
        description: shortcut.description,
        scope: shortcut.scope,
      })),
      onClose,
    }),
    [open, onClose],
  );

  if (!open) return null;

  return <VueIsland component={ShortcutsHelpView} componentProps={viewProps} />;
}
