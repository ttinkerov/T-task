import { expect, test } from '@playwright/test';
import { login, logout, registerAndOpenBoard } from './helpers/board';

test.describe('Auth shell @smoke', () => {
  test('login and register shells render and accept credentials flow', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Зарегистрироваться' })).toBeVisible();

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Регистрация' })).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();

    const { email, password } = await registerAndOpenBoard(page, 'auth-shell');
    await logout(page);
    await login(page, email, password);
    await expect(page).toHaveURL(/\/dashboard\/board/);
  });
});
