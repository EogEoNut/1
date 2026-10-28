import { describe, expect, it } from 'vitest'
import { catalog } from '../data/catalog'
import { filterWorkbenchWeapons, initialWorkbenchWeapon, workbenchCategories, workbenchWeapons } from './workbench'

describe('실제 자료가 비어 있는 작업대', () => {
  it('제거한 총기를 유지하지 않고 가상 샘플로 안전하게 시작한다', () => {
    expect(workbenchWeapons).toHaveLength(3)
    expect(new Set(workbenchWeapons.map(item => item.id)).size).toBe(3)
    expect(initialWorkbenchWeapon).toMatchObject({ kind: 'sample', name: 'AR-01 신더' })
    for (const entry of workbenchWeapons) {
      expect(entry.kind).toBe('sample')
      expect(catalog.weapons).toContain(entry.weapon)
    }
  })
  it('전면전 빈 필터와 샘플 검색·분류가 서로 섞이지 않는다', () => {
    expect(filterWorkbenchWeapons('warfare', '', '전체')).toEqual([])
    expect(filterWorkbenchWeapons('sample', '', '전체')).toHaveLength(3)
    expect(filterWorkbenchWeapons('all', 'cinder', '전체').map(item => item.name)).toEqual(['AR-01 신더'])
    expect(filterWorkbenchWeapons('sample', '스위프트', '돌격소총')).toEqual([])
    expect(workbenchCategories('warfare')).toEqual([])
    expect(workbenchCategories('sample')).toEqual(['돌격소총', '기관단총', '지정사수소총'])
  })
})
