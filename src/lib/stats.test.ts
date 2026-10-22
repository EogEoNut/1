import { describe, expect, it } from 'vitest'
import { catalog } from '../data/catalog'
import { statKeys } from '../types'
import { calculateStats, compatibilityReason } from './stats'

const weapon = catalog.weapons[0]
const attachments = catalog.attachments
const getPart = (id: string) => attachments.find(part => part.id === id)!

describe('샘플 능력치 계산', () => {
  it('기본 구성은 원본 능력치를 유지한다', () => {
    expect(calculateStats(weapon, {}, attachments)).toEqual(weapon.stats)
  })
  it('여러 부착물의 장점과 단점을 합산하고 원본을 변경하지 않는다', () => {
    const original = structuredClone(weapon)
    const stats = calculateStats(weapon, { muzzle: 'muzzle-brake', foregrip: 'grip-vertical' }, attachments)
    expect(stats).toEqual({ control: 80, handling: 46, stability: 62, mobility: 60, range: 55 })
    expect(weapon).toEqual(original)
  })
  it('모든 점수를 0~100 사이로 제한한다', () => {
    const high = { ...weapon, stats: { ...weapon.stats, control: 99, handling: 1 } }
    const stats = calculateStats(high, { muzzle: 'muzzle-brake' }, attachments)
    expect(stats.control).toBe(100)
    expect(stats.handling).toBe(0)
  })
  it('부착물을 제거하면 기본 능력치로 돌아온다', () => {
    const loadout = { muzzle: 'muzzle-brake' }
    expect(calculateStats(weapon, loadout, attachments).control).toBe(72)
    delete (loadout as { muzzle?: string }).muzzle
    expect(calculateStats(weapon, loadout, attachments)).toEqual(weapon.stats)
  })
  it('존재하지 않는 부착물과 잘못된 슬롯을 거절한다', () => {
    expect(() => calculateStats(weapon, { optic: 'missing' }, attachments)).toThrow('알 수 없는')
    expect(() => calculateStats(weapon, { optic: 'muzzle-brake' }, attachments)).toThrow('슬롯')
  })
})

describe('샘플 호환성', () => {
  it('총기별 장착 가능 여부를 검사한다', () => {
    expect(compatibilityReason(catalog.weapons[1], {}, getPart('optic-scope'), attachments)).toContain('장착할 수 없습니다')
    expect(() => calculateStats(catalog.weapons[1], { optic: 'optic-scope' }, attachments)).toThrow('장착할 수 없습니다')
  })
  it('서로 충돌하는 부품은 양방향으로 거절한다', () => {
    expect(compatibilityReason(weapon, { barrel: 'barrel-short' }, getPart('muzzle-suppressor'), attachments)).toContain('컴팩트 총열')
    expect(compatibilityReason(weapon, { muzzle: 'muzzle-suppressor' }, getPart('barrel-short'), attachments)).toContain('롱 소음기')
    expect(() => calculateStats(weapon, { barrel: 'barrel-short', muzzle: 'muzzle-suppressor' }, attachments)).toThrow('함께 장착')
  })
  it('한 방향으로만 정의된 충돌도 양방향으로 검사한다', () => {
    const parts = attachments.map(part => part.id === 'muzzle-suppressor' ? { ...part, incompatibleWith: [] } : part)
    expect(compatibilityReason(weapon, { barrel: 'barrel-short' }, parts.find(p => p.id === 'muzzle-suppressor')!, parts)).toBeTruthy()
  })
  it('같은 슬롯의 기존 부착물을 다른 부착물로 교체할 수 있다', () => {
    expect(compatibilityReason(weapon, { barrel: 'barrel-short' }, getPart('barrel-long'), attachments)).toBeNull()
  })
})

describe('JSON 카탈로그 무결성', () => {
  it('고유 ID, 출처, 슬롯 및 호환 대상이 유효하다', () => {
    const all = [...catalog.weapons, ...attachments]
    expect(new Set(all.map(item => item.id)).size).toBe(all.length)
    for (const item of all) {
      expect(item.provenance.status).toBe('sample')
      expect(item.provenance.source.length).toBeGreaterThan(0)
      expect(item.provenance.verifiedAt).toBeNull()
    }
    for (const part of attachments) {
      for (const id of part.weaponIds) {
        const target = catalog.weapons.find(item => item.id === id)
        expect(target?.slots).toContain(part.slot)
      }
      for (const id of part.incompatibleWith) expect(attachments.some(item => item.id === id)).toBe(true)
      for (const [key, value] of Object.entries(part.modifiers)) {
        expect(statKeys).toContain(key)
        expect(Number.isFinite(value)).toBe(true)
      }
    }
    for (const item of catalog.weapons) {
      expect(new Set(item.slots).size).toBe(item.slots.length)
      for (const key of statKeys) {
        expect(item.stats[key]).toBeGreaterThanOrEqual(0)
        expect(item.stats[key]).toBeLessThanOrEqual(100)
      }
    }
  })
})
