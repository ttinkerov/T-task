import { expect, test } from '@playwright/test';
import {
  createTaskInFirstColumn,
  dragTaskHandleToColumn,
  login,
  logout,
  registerAndOpenBoard,
} from './helpers/board';

/**
 * Critical-path smoke for a public repo: auth must work, tasks must create,
 * and kanban DnD must move cards between columns.
 */
test.describe('Smoke @smoke', () => {
  test('login → create task → drag to another column', async ({ page }) => {
    const { email, password } = await registerAndOpenBoard(page, 'smoke');

    await logout(page);
    await login(page, email, password);

    const title = `Smoke DnD ${Date.now()}`;
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
