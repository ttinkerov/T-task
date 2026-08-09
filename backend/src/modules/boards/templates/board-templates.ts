export type BoardTemplate = {
  id: string;
  name: string;
  description: string;
  columns: string[];
};

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'kanban',
    name: 'Канбан',
    description: 'Классический поток: бэклог → работа → готово',
    columns: ['Бэклог', 'В работе', 'Готово'],
  },
  {
    id: 'sprint',
    name: 'Спринт',
    description: 'Для итераций и ежедневных стендапов',
    columns: ['К выполнению', 'В работе', 'Ревью', 'Готово'],
  },
  {
    id: 'bugs',
    name: 'Баг-триаж',
    description: 'Очередь инцидентов',
    columns: ['Новые', 'Подтверждено', 'В работе', 'Проверка', 'Закрыто'],
  },
];

export function getBoardTemplate(id?: string | null): BoardTemplate {
  return BOARD_TEMPLATES.find((item) => item.id === id) ?? BOARD_TEMPLATES[0];
}
