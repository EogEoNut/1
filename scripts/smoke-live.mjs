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
    await expect(page.locator('.weapon-card')).toHaveCount(3)
    await expect(page.locator('.weapon-card').first().locator('strong')).toBeInViewport()
    await expect(page.locator('.sample-banner')).toContainText('가상 샘플')
    await expect(page.locator('.schematic').getByRole('img')).toBeVisible()
    await page.getByRole('button', { name: '전면전 (0)', exact: true }).click()
    await expect(page.getByRole('region', { name: '개조 작업대', exact: true })).toContainText('전면전 총기 자료 미등록')
    await expect(page.getByTestId('current-control')).toHaveCount(0)
    await page.getByRole('link', { name: '델타 랩 홈', exact: true }).click()
    await expect(page.getByTestId('current-control')).toHaveText('62')
    await page.getByRole('button', { name: '가상 샘플 작업대', exact: true }).click()
    await expect(page.getByTestId('current-control')).toHaveText('62')
    await page.locator('[data-slot="muzzle"]').click()
    await page.getByRole('button', { name: /제어형 제퇴기/ }).click()
    await expect(page.getByTestId('current-control')).toHaveText('72')
    await page.getByRole('button', { name: '전체 초기화' }).click()
    await expect(page.getByTestId('current-control')).toHaveText('62')
    await page.getByRole('button', { name: /SM-02 스위프트/ }).click()
    await expect(page.getByTestId('current-mobility')).toHaveText('82')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '가로 넘침이 없어야 합니다.')
    await page.getByRole('button', { name: '전면전 기본 총기 자료', exact: true }).click()
    await expect(page.getByRole('heading', { name: '전면전 기본 총기 자료', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '전면전 총기 자료 미등록', exact: true })).toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(/Aim Sector|aimsector|DFTTK/i)
    await expect(page.getByText('부착물 데이터 미등록 · 추후 업데이트 예정', { exact: true })).toBeVisible()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '전면전 자료 화면에 가로 넘침이 없어야 합니다.')
    assert.deepEqual(errors, [], '브라우저 실행 오류가 없어야 합니다.')
    completed.push(`${viewport.width}px: HTTP 200, 가상 샘플 3종·이미지·장착·초기화·총기 변경·홈 복귀, 전면전 빈 자료·부착물 미등록, 반응형 배치 통과`)
    console.log('PASS:', completed.at(-1))
    await page.close()
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## 공개 웹앱 검증 성공\n\n검증 주소: ${target.href}\n\n${completed.map(result => `- ${result}`).join('\n')}\n`)
  }
} finally {
  await browser.close()
}
