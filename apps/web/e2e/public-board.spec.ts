import { expect, test } from '@playwright/test'

const publicSlug = process.env.E2E_PUBLIC_BOARD_SLUG?.trim()

test.describe('Public board', () => {
  test.skip(!publicSlug, 'Set E2E_PUBLIC_BOARD_SLUG to run')

  test('loads read-only board and hides AI/Activity tabs in task panel', async ({ page }) => {
    await page.goto(`/p/${publicSlug}`)

    await expect(page.getByText(/public board/i)).toBeVisible({ timeout: 30_000 })

    const firstCard = page.getByTestId('project-task-card').first()
    await expect(firstCard).toBeVisible({ timeout: 30_000 })
    await firstCard.click()

    await expect(page.getByRole('tab', { name: 'Properties' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'AI' })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Activity' })).toHaveCount(0)
  })
})
