import { type Page, expect } from '@playwright/test';

export async function registerAndOpenBoard(page: Page, label: string) {
  const email = `e2e-${label}-${Date.now()}@example.com`;
  const password = 'Password123!';

  await page.goto('/register');
  await expect(page.locator('#name')).toBeVisible();
  await page.locator('#name').fill(`E2E ${label}`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/auth/register') && response.request().method() === 'POST',
    { timeout: 30_000 },
  );

  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  const registerResponse = await registerResponsePromise;
  expect(
    registerResponse.ok(),
    `Register failed: ${registerResponse.status()} ${await registerResponse.text()}`,
  ).toBeTruthy();

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

export async function dragTaskHandleToColumn(
  page: Page,
  taskTitle: string,
  targetColumnTestId: string,
) {
  const task = page.locator('[data-testid^="kanban-task-"]').filter({ hasText: taskTitle }).first();
  const handle = task.getByRole('button', { name: 'Перетащить задачу' });

  const targetColumn = page.getByTestId(targetColumnTestId);

  await handle.scrollIntoViewIfNeeded();
  await targetColumn.scrollIntoViewIfNeeded();

  const from = await handle.boundingBox();
  const to = await targetColumn.boundingBox();
  if (!from || !to) {
    throw new Error('Missing drag geometry');
  }

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const endX = to.x + to.width / 2;
  const endY = to.y + Math.min(Math.max(to.height * 0.4, 72), to.height - 48);

  const moveResponsePromise = page.waitForResponse(
    (response) =>
      /\/tasks\/[^/]+\/move(?:\?|$)/.test(response.url()) &&
      response.request().method() === 'PATCH',
    { timeout: 15_000 },
  );

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 24, startY + 10, { steps: 6 });
  await page.mouse.move(endX, endY, { steps: 24 });
  await page.mouse.up();

  const moveResponse = await moveResponsePromise;
  expect(
    moveResponse.ok(),
    `Move failed: ${moveResponse.status()} ${await moveResponse.text()}`,
  ).toBeTruthy();
}
