import { createApp, type Component } from 'vue';

export function mountVueApp(host: HTMLElement, root: Component, props?: Record<string, unknown>) {
  const app = createApp(root, props);
  app.mount(host);

  return () => {
    app.unmount();
  };
}
