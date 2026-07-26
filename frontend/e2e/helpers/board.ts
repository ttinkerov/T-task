import { type Page, expect } from '@playwright/test';

export async function registerAndOpenBoard(page: Page, label: string) {
  const email = `e2e-${label}-${Date.now()}@example.com`;
  const password = 'Password123!';

  await page.goto('/register');
  await page.locator('#name').fill(`E2E ${label}`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 30_000 });
  await page.getByLabel('Название команды').fill(`E2E ${label}`);
  await page.getByRole('button', { name: 'Далее — к доске' }).click();
  await page.getByRole('button', { name: 'Далее — к задаче' }).click();
  await page.getByLabel('Название первой задачи').fill(`E2E first task ${label}`);
  await page.getByRole('button', { name: 'Создать и открыть доску' }).click();

  await expect(page).toHaveURL(/\/dashboard\/board/, { timeout: 45_000 });
  await closeTaskDrawerIfOpen(page);
  await ensureKanbanReady(page);

  return { email, password };
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/dashboard\/board/, { timeout: 30_000 });
  await closeTaskDrawerIfOpen(page);
  await ensureKanbanReady(page);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
}

export async function closeTaskDrawerIfOpen(page: Page) {
  const drawer = page.getByTestId('task-detail-drawer');
  if (!(await drawer.isVisible().catch(() => false))) {
    return;
  }
  await drawer.getByRole('button', { name: 'Закрыть' }).click();
  await expect(drawer).toBeHidden();
}

/**
 * Wait until kanban columns are mounted. Empty-task CTA may overlay the board
 * but columns stay in the DOM so DnD helpers can proceed after creating a task.
 */
export async function ensureKanbanReady(page: Page) {
  const columns = page.locator('[data-testid^="kanban-column-"]');
  const firstTaskCta = page.getByRole('button', { name: 'Добавить первую задачу' });
  const addColumnCta = page.getByRole('button', { name: 'Добавить колонку' });

  await expect
    .poll(
      async () => {
        if ((await columns.count()) > 0) return 'columns';
        if (await firstTaskCta.isVisible().catch(() => false)) return 'first-task';
        if (await addColumnCta.isVisible().catch(() => false)) return 'add-column';
        return 'waiting';
      },
      { timeout: 45_000 },
    )
    .not.toBe('waiting');

  if ((await columns.count()) === 0 && (await addColumnCta.isVisible().catch(() => false))) {
    await addColumnCta.click();
  }

  if ((await columns.count()) === 0 && (await firstTaskCta.isVisible().catch(() => false))) {
    await firstTaskCta.click();
  }

  await expect(columns.first()).toBeVisible({ timeout: 30_000 });
}

export async function createTaskInFirstColumn(page: Page, title: string) {
  await ensureKanbanReady(page);

  // Dismiss empty overlay so the column "add task" form is interactive.
  const firstTaskCta = page.getByRole('button', { name: 'Добавить первую задачу' });
  if (await firstTaskCta.isVisible().catch(() => false)) {
    await firstTaskCta.click();
    await expect(firstTaskCta).toBeHidden({ timeout: 20_000 });
  }

  const column = page.locator('[data-testid^="kanban-column-"]').first();
  await column.locator('.kanban-column__add-input').fill(title);
  await column.getByRole('button', { name: 'Добавить задачу' }).click();
  await expect(
    page.locator('[data-testid^="kanban-task-"]').filter({ hasText: title }).first(),
  ).toBeVisible();
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
