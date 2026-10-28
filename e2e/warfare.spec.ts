import { expect, test } from '@playwright/test'

test('수집 실패와 미등록 상태를 사실대로 표시하고 게임 데이터를 만들지 않는다', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: '전면전 기본 총기 자료', exact: true }).click()
  await expect(page.getByRole('heading', { name: '전면전 기본 총기 자료', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '전면전 총기 자료 미등록', exact: true })).toBeVisible()
  await expect(page.locator('.warfare-warning')).toContainText('나무위키 문서 접근 제한')
  await expect(page.getByRole('region', { name: '전면전 자료 등록 상태' })).toContainText('403 Forbidden')
  await expect(page.getByRole('region', { name: '전면전 자료 등록 상태' })).toContainText('원문 확인일미확인')
  await expect(page.getByText('부착물 데이터 미등록 · 추후 업데이트 예정', { exact: true })).toBeVisible()
  await expect(page.getByRole('radio')).toHaveCount(0)
  await expect(page.locator('.warfare-weapon-list button')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /대상 출처: 나무위키/ })).toHaveAttribute('href', /namu\.wiki/)
  await expect(page.locator('body')).not.toContainText(/Aim Sector|aimsector|DFTTK/i)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  expect(errors).toEqual([])
  await page.getByRole('button', { name: '가상 샘플 작업대', exact: true }).click()
  await expect(page.getByTestId('current-control')).toHaveText('62')
})
