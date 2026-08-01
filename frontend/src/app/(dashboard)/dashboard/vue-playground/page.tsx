'use client';

import { VueIsland } from '@/components/vue/VueIsland';
import HelloVue from '@/vue/playground/HelloVue.vue';

export default function VuePlaygroundPage() {
  return (
    <main style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Vue playground</h2>
      <VueIsland component={HelloVue} componentProps={{ title: 'Шаг 1 · Hello Vue' }} />
    </main>
  );
}
