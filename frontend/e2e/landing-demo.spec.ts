import { expect, test } from '@playwright/test';

test.describe('Landing demo @smoke', () => {
  test('loads interactive demo board and adds a task', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#demo .tt-demo-board')).toBeVisible({ timeout: 20_000 });

    const column = page.locator('.tt-demo-column').first();
    await expect(column).toBeVisible();

    const title = `Landing demo ${Date.now()}`;
    await column.locator('.tt-demo-column__add-input').fill(title);
    await column.getByRole('button', { name: 'Добавить задачу' }).click();
    await expect(column.getByText(title, { exact: true })).toBeVisible();

    await column.getByRole('button', { name: 'Удалить задачу' }).last().click();
    await expect(column.getByText(title, { exact: true })).toHaveCount(0);
  });

  test('can add an empty column from demo board', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#demo .tt-demo-board')).toBeVisible({ timeout: 20_000 });

    const name = `Col ${Date.now()}`;
    await page.locator('.tt-demo-board__input').fill(name);
    await page.locator('.tt-demo-board__add-btn').click();
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  });
});
