import { expect, it, vi } from 'vitest'

vi.mock('./warfare', async () => {
  const { mathFixture } = await import('./test-fixtures/warfare')
  return { weapons: [{ ...mathFixture(), category: 'assault_rifle', parts: [], slots: [] }] }
})
import { filterWorkbenchWeapons, initialWorkbenchWeapon } from './workbench'

it('향후 등록 총기의 한국어·영어 검색과 분류를 연결한다 (테스트 전용 가상 입력)', () => {
  expect(initialWorkbenchWeapon.kind).toBe('warfare')
  expect(filterWorkbenchWeapons('warfare', 'synthetic', '돌격소총')).toHaveLength(1)
  expect(filterWorkbenchWeapons('warfare', '계산 검사', '전체')).toHaveLength(1)
  expect(filterWorkbenchWeapons('warfare', '', '기관단총')).toHaveLength(0)
  expect(filterWorkbenchWeapons('sample', 'synthetic', '전체')).toHaveLength(0)
})
