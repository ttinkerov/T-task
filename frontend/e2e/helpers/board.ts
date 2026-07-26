import { type Page, expect } from '@playwright/test';

export async function registerAndOpenBoard(page: Page, label: string) {
  const email = `e2e-${label}-${Date.now()}@example.com`;
  const password = 'Password123!';

  await page.goto('/register');
  await page.locator('#name').fill(`E2E ${label}`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel('Название команды').fill(`E2E ${label}`);
  await page.getByRole('button', { name: 'Далее — к доске' }).click();
  await page.getByRole('button', { name: 'Далее — к задаче' }).click();
  await page.getByLabel('Название первой задачи').fill(`E2E first task ${label}`);
  await page.getByRole('button', { name: 'Создать и открыть доску' }).click();

  await expect(page).toHaveURL(/\/dashboard\/board/);
  await expect(page.locator('[data-testid^="kanban-column-"]').first()).toBeVisible();

  return { email, password };
}

export async function createTaskInFirstColumn(page: Page, title: string) {
  const column = page.locator('[data-testid^="kanban-column-"]').first();
  await column.locator('.kanban-column__add-input').fill(title);
  await column.getByRole('button', { name: 'Добавить задачу' }).click();
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
}

/** dnd-kit needs a small move past activationConstraint.distance before the drop. */
export async function dragTaskHandleToColumn(
  page: Page,
  taskTitle: string,
  targetColumnTestId: string,
) {
  const task = page.locator('[data-testid^="kanban-task-"]').filter({ hasText: taskTitle }).first();
  const handle = task.getByRole('button', { name: 'Перетащить задачу' });
  const target = page.getByTestId(targetColumnTestId).locator('.kanban-column__tasks');

  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) {
    throw new Error('Missing drag geometry');
  }

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const endX = to.x + Math.min(to.width / 2, 80);
  const endY = to.y + 36;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 12, startY + 4, { steps: 4 });
  await page.mouse.move(endX, endY, { steps: 16 });
  await page.mouse.up();
}
