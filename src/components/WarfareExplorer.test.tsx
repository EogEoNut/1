import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

// Test-only records verify the populated UI without adding invented guns to the app.
vi.mock('../lib/warfare', async importOriginal => {
  const original = await importOriginal<typeof import('../lib/warfare')>()
  const { mathFixture } = await import('../lib/test-fixtures/warfare')
  const weapon = mathFixture()
  weapon.parts = []
  weapon.slots = []
  weapon.base!.muzzle_velocity_mps = 123
  weapon.fireModes = ['검사 전용 사격 모드']
  return { ...original, weapons: [weapon] }
})
import { WarfareExplorer } from './WarfareExplorer'

it('새 필드와 단위·미확인·출처 및 부착물 미등록을 렌더링한다 (테스트 전용 가상 입력)', () => {
  const html = renderToStaticMarkup(<WarfareExplorer />)
  expect(html).toContain('계산 검사 전용')
  expect(html).toContain('Synthetic fixture')
  expect(html).toContain('검사 전용 사격 모드')
  expect(html).toContain('총구 초속</dt><dd>123 <small>m/s</small>')
  expect(html).toContain('기본 장탄수</dt><dd>미확인')
  expect(html).toContain('TestFixture')
  expect(html).toContain('2026-01-01')
  expect(html).toContain('외부 자료 관측 · 게임 내 미검증')
  expect(html).toContain('부착물 데이터 미등록')
  expect(html).not.toContain('type="radio"')
})
