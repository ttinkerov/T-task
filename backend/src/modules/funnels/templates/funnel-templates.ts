export type FunnelTemplate = {
  id: string;
  name: string;
  description: string;
  stages: string[];
};

export const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    id: 'sales',
    name: 'Продажи',
    description: 'Классическая B2B/B2C воронка',
    stages: ['Новая', 'Квалификация', 'Предложение', 'Переговоры', 'Успех'],
  },
  {
    id: 'recruiting',
    name: 'Найм',
    description: 'Подбор кандидатов',
    stages: ['Отклик', 'Скрининг', 'Интервью', 'Оффер', 'Выход'],
  },
  {
    id: 'support',
    name: 'Поддержка',
    description: 'Тикеты клиентов',
    stages: ['Новый', 'В работе', 'Ожидание клиента', 'Решено'],
  },
];

export function getFunnelTemplate(id?: string | null): FunnelTemplate {
  return FUNNEL_TEMPLATES.find((item) => item.id === id) ?? FUNNEL_TEMPLATES[0];
}
