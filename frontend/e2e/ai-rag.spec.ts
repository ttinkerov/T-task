import { expect, test } from '@playwright/test';
import { registerAndOpenBoard } from './helpers/board';

test.describe('AI RAG status UI', () => {
  test('shows RAG status block on workspace settings', async ({ page }) => {
    await registerAndOpenBoard(page, 'rag-status');

    const workspaceId = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('t-task-workspace');
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { state?: { currentWorkspaceId?: string } };
        return parsed.state?.currentWorkspaceId ?? null;
      } catch {
        return null;
      }
    });

    expect(workspaceId).toBeTruthy();
    await page.goto(`/dashboard/workspaces/${workspaceId}/settings`);

    await expect(page.getByTestId('ai-settings-card')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('ai-rag-status')).toBeVisible();
    await expect(page.getByTestId('ai-rag-status')).toContainText(/RAG/i);

    const statusResponse = await page.request.get(
      `/api/v1/workspaces/${workspaceId}/ai/rag/status`,
      {
        headers: { 'x-workspace-id': workspaceId! },
      },
    );
    expect(statusResponse.ok()).toBeTruthy();
    const body = (await statusResponse.json()) as {
      success: boolean;
      data: {
        indexedChunks: number;
        ragAvailable: boolean;
        embeddingModel: string;
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.embeddingModel).toBeTruthy();
    expect(typeof body.data.indexedChunks).toBe('number');
    expect(typeof body.data.ragAvailable).toBe('boolean');
  });
});
