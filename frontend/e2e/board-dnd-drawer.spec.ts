import { expect, test } from '@playwright/test';
import {
  createTaskInFirstColumn,
  dragTaskHandleToColumn,
  registerAndOpenBoard,
} from './helpers/board';

test.describe('Board regressions after perf', () => {
  test('opens task drawer from a card click', async ({ page }) => {
    await registerAndOpenBoard(page, 'drawer');
    const title = `Drawer ${Date.now()}`;
    await createTaskInFirstColumn(page, title);

    await page.getByText(title, { exact: true }).first().click();

    const drawer = page.getByTestId('task-detail-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('textbox', { name: 'Название', exact: true })).toHaveValue(title);
  });

  test('drags a task into another column', async ({ page }) => {
    await registerAndOpenBoard(page, 'dnd');
    const title = `DnD ${Date.now()}`;
    await createTaskInFirstColumn(page, title);

    const columns = page.locator('[data-testid^="kanban-column-"]');
    await expect(columns).toHaveCount(await columns.count());
    expect(await columns.count()).toBeGreaterThanOrEqual(2);

    const sourceColumnId = await columns.nth(0).getAttribute('data-testid');
    const targetColumnId = await columns.nth(1).getAttribute('data-testid');
    expect(sourceColumnId).toBeTruthy();
    expect(targetColumnId).toBeTruthy();

    await expect(page.getByTestId(sourceColumnId!).getByText(title, { exact: true })).toBeVisible();

    await dragTaskHandleToColumn(page, title, targetColumnId!);

    await expect(page.getByTestId(targetColumnId!).getByText(title, { exact: true })).toBeVisible({
      timeout: 20_000,
    });
  });
});
