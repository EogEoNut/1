import { describe, expect, it } from 'vitest'
import { catalog } from '../data/catalog'
import { weapons } from './warfare'
import { filterWorkbenchWeapons, initialWorkbenchWeapon, workbenchCategories, workbenchWeapons } from './workbench'

describe('작업대 통합 총기 목록', () => {
  it('전면전 66종과 샘플 3종의 ID와 데이터 경계를 유지한다', () => {
    expect(workbenchWeapons).toHaveLength(69)
    expect(new Set(workbenchWeapons.map(item => item.id)).size).toBe(69)
    for (const entry of workbenchWeapons) {
      if (entry.kind === 'warfare') expect(weapons).toContain(entry.weapon)
      else expect(catalog.weapons).toContain(entry.weapon)
    }
    expect(initialWorkbenchWeapon).toMatchObject({ kind: 'warfare', name: 'M4A1' })
  })
  it('자료 필터를 구분하고 검색·분류를 함께 적용한다', () => {
    expect(filterWorkbenchWeapons('warfare', '', '전체')).toHaveLength(66)
    expect(filterWorkbenchWeapons('sample', '', '전체')).toHaveLength(3)
    expect(filterWorkbenchWeapons('all', ' m4a1 ', '돌격소총').map(item => item.name)).toEqual(['M4A1'])
    expect(filterWorkbenchWeapons('sample', 'cinder', '전체').map(item => item.name)).toEqual(['AR-01 신더'])
    expect(filterWorkbenchWeapons('warfare', 'cinder', '전체')).toEqual([])
    expect(filterWorkbenchWeapons('warfare', 'M4A1', '권총')).toEqual([])
    expect(workbenchCategories('sample')).toEqual(['돌격소총', '기관단총', '지정사수소총'])
  })
})
