import assert from 'node:assert/strict'
import { appendFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { chromium, expect } from '@playwright/test'

if (!process.env.LIVE_URL) throw new Error('LIVE_URL에 검사할 사이트 주소를 지정하세요.')
const target = new URL(process.env.LIVE_URL)
assert(target.protocol === 'https:' || (target.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(target.hostname)), 'HTTPS 사이트 또는 로컬 테스트 서버만 지원합니다.')
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? ['/usr/bin/chromium', '/usr/bin/google-chrome'].find(candidate => existsSync(candidate))
const browser = await chromium.launch({ executablePath })
const completed = []

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const response = await page.goto(target.href, { waitUntil: 'networkidle', timeout: 60000 })
    assert.equal(response?.status(), 200, '공개 페이지가 HTTP 200을 반환해야 합니다.')
    await expect(page.getByRole('heading', { name: '당신의 전투에 맞는 한 자루.' })).toBeVisible()
    await expect(page.getByTestId('current-control')).toHaveText('62')
    await page.locator('[data-slot="muzzle"]').click()
    await page.getByRole('button', { name: /제어형 제퇴기/ }).click()
    await expect(page.getByTestId('current-control')).toHaveText('72')
    await page.getByRole('button', { name: '전체 초기화' }).click()
    await expect(page.getByTestId('current-control')).toHaveText('62')
    await page.getByRole('button', { name: /SM-02 스위프트/ }).click()
    await expect(page.getByTestId('current-mobility')).toHaveText('82')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '가로 넘침이 없어야 합니다.')
    await page.getByRole('button', { name: '전면전 실제 자료 (부분 수집)', exact: true }).click()
    await expect(page.getByRole('heading', { name: '전면전 총기·부착물 자료', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'M4A1', exact: true })).toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(9)
    await page.getByRole('radio', { name: /416实用后握把/ }).check()
    await expect(page.getByTestId('warfare-stat-handling').locator('strong')).toHaveText('60')
    await page.getByRole('button', { name: '전체 파츠 해제', exact: true }).click()
    await expect(page.getByTestId('warfare-stat-handling').locator('strong')).toHaveText('58')
    await expect(page.getByRole('region', { name: '선택 부착물과 기여도' })).toContainText('선택한 부착물이 없습니다.')
    const recommendation = page.getByRole('region', { name: '플레이 스타일 추천 기반' })
    await recommendation.getByRole('combobox', { name: '선호 전투 스타일' }).selectOption('recoil')
    await expect(recommendation).toContainText('반동 제어 60%')
    await expect(recommendation).toContainText('추천 보류 · 검증 자료 부족')
    await page.getByRole('textbox', { name: '총기 검색 (66종)' }).fill('AKM')
    await page.locator('.warfare-weapon-list button').click()
    await page.getByRole('radio', { name: /X25U Angled Combat Grip/ }).check()
    await expect(page.getByRole('radio', { name: /MRGS Skeleton Stock/ })).toBeEnabled()
    await expect(page.getByRole('radio', { name: /QR High-Performance Stock/ })).toBeDisabled()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '전면전 자료 화면에 가로 넘침이 없어야 합니다.')
    assert.deepEqual(errors, [], '브라우저 실행 오류가 없어야 합니다.')
    completed.push(`${viewport.width}px: HTTP 200, 샘플 작업대, DFTTK 관측 부품 선택·해제, 선택 요약, 미확인 조합 제한, 스타일 가중치와 추천 보류, 반응형 배치 통과`)
    console.log('PASS:', completed.at(-1))
    await page.close()
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## 공개 웹앱 검증 성공\n\n검증 주소: ${target.href}\n\n${completed.map(result => `- ${result}`).join('\n')}\n`)
  }
} finally {
  await browser.close()
}
