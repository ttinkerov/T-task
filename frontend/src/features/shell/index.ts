// Shell Vue islands: import components directly —
// do not re-export here (pulls Vue into every barrel consumer).
export {
  useCreateTaskShortcutListener,
  useShortcutHandlers,
  dispatchShortcut,
} from './hooks/use-shortcut-handlers';
export { SHORTCUTS } from './lib/shortcuts';
