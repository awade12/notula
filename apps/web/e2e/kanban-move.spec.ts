import { expect, test } from '@playwright/test'
import { loginViaUi, requireEnv } from './helpers/auth'

const hasAuth =
  Boolean(process.env.E2E_EMAIL?.trim()) &&
  Boolean(process.env.E2E_PASSWORD?.trim()) &&
  Boolean(process.env.E2E_BOARD_URL?.trim())

test.describe('Kanban move', () => {
  test.skip(!hasAuth, 'Set E2E_EMAIL, E2E_PASSWORD, and E2E_BOARD_URL to run')

  test('dragging a task card to another column persists after reload', async ({ page }) => {
    const email = requireEnv('E2E_EMAIL')
    const password = requireEnv('E2E_PASSWORD')
    const boardUrl = requireEnv('E2E_BOARD_URL')

    await loginViaUi(page, email, password)
    await page.goto(boardUrl)

    const cards = page.getByTestId('project-task-card')
    await expect(cards.first()).toBeVisible({ timeout: 30_000 })

    const cardCount = await cards.count()
    test.skip(cardCount < 1, 'Board has no tasks to move')

    const source = cards.first()
    const taskId = await source.getAttribute('data-task-id')
    expect(taskId).toBeTruthy()

    const sourceColumn = source.locator('xpath=ancestor::*[@data-testid="kanban-column"][1]')
    const sourceColumnId = await sourceColumn.getAttribute('data-column-id')

    const columns = page.getByTestId('kanban-column')
    const columnCount = await columns.count()
    let targetColumn = columns.first()
    let targetColumnId = await targetColumn.getAttribute('data-column-id')

    for (let index = 0; index < columnCount; index += 1) {
      const candidate = columns.nth(index)
      const candidateId = await candidate.getAttribute('data-column-id')
      if (candidateId && candidateId !== sourceColumnId) {
        targetColumn = candidate
        targetColumnId = candidateId
        break
      }
    }

    await expect(targetColumn).toBeVisible()
    expect(targetColumnId).toBeTruthy()
    expect(targetColumnId).not.toBe(sourceColumnId)

    await source.dragTo(targetColumn)
    await page.waitForTimeout(800)

    await page.reload()
    await expect(page.getByTestId('project-task-card').first()).toBeVisible({ timeout: 30_000 })

    const movedCard = page.locator(`[data-testid="project-task-card"][data-task-id="${taskId}"]`)
    await expect(movedCard).toBeVisible()
    const newColumn = movedCard.locator('xpath=ancestor::*[@data-testid="kanban-column"][1]')
    await expect(newColumn).toHaveAttribute('data-column-id', targetColumnId!)
  })
})
