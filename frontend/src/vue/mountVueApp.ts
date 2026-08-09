import { createApp, h, shallowRef, type Component } from 'vue';

export type MountedVueApp = {
  update: (next?: Record<string, unknown>) => void;
  unmount: () => void;
};

export function mountVueApp(
  host: HTMLElement,
  root: Component,
  initialProps: Record<string, unknown> = {},
): MountedVueApp {
  const propsRef = shallowRef({ ...initialProps });

  const app = createApp({
    name: 'VueIslandRoot',
    setup() {
      return () => h(root, propsRef.value);
    },
  });

  app.mount(host);

  return {
    update(next = {}) {
      propsRef.value = { ...next };
    },
    unmount() {
      app.unmount();
    },
  };
}
