import { describe, expect, it } from 'vitest'
import { calculate, metadata, weapons } from './warfare'
import { warfareCatalog } from './warfare-data'
import seed from '../data/warfare_seed.json'
import { mathFixture } from './test-fixtures/warfare'

const m4 = weapons.find(weapon => weapon.name === 'M4A1')!
const akm = weapons.find(weapon => weapon.name === 'AKM')!

describe('출처 기반 전면전 자료', () => {
  it('목록과 출처를 구분하고 원자료 확인일을 유지한다', () => {
    expect(new Set(weapons.map(weapon => weapon.name)).size).toBe(weapons.length)
    expect(metadata.weaponCount).toBe(66)
    expect(metadata.attachmentRecordCount).toBe(16)
    expect(metadata.observedWeaponCount).toBe(1)
    expect(metadata.date).toBe('2026-10-23')
    for (const weapon of weapons) {
      for (const part of weapon.parts) {
        expect(part.evidence.observedAt).toBe('2026-10-23')
        expect(part.evidence.sourceUrl).toMatch(/^https:\/\//)
        expect(part.evidence.gameVerified).toBe(false)
      }
    }
  })
  it('제거된 외부 수치를 0으로 대체하지 않고 남겨 둔 출처의 단위를 보존한다', () => {
    expect(m4.base).toBeNull()
    expect(m4.baseEvidence).toBeNull()
    expect(m4.parts).toEqual([])
    expect(akm.base?.range_m).toBe(30)
    expect(akm.base?.rpm).toBe(600)
    expect(akm.base?.ads_ms).toBe(327)
  })
  it('제거 요청된 출처가 원자료와 실행 카탈로그에 남아 있지 않다', () => {
    expect(JSON.stringify(seed)).not.toMatch(/dfttk/i)
    expect(JSON.stringify(warfareCatalog)).not.toMatch(/dfttk/i)
    expect(metadata.sourceNames).toEqual(['Aim Sector'])
  })
  it('표시 변화량을 합산하되 기본 자료와 부착물을 변경하지 않는다', () => {
    const fixture = mathFixture()
    const part = fixture.parts[0]
    const before = structuredClone(fixture)
    const result = calculate(fixture, { [part.slot]: part.id })
    expect(result.control.final).toBe(20)
    expect(result.handling.final).toBe(34)
    expect(result.stability.final).toBe(38)
    expect(fixture).toEqual(before)
  })
  it('수치가 없는 부착물은 최종 참고값을 미확인으로 표시한다', () => {
    const part = akm.parts[0]
    const result = calculate(akm, { [part.slot]: part.id })
    expect(result.control.base).toBe(39)
    expect(result.control.final).toBeNull()
    expect(result.control.unknownCount).toBe(1)
  })
  it('잘못된 슬롯과 총기 기록에 없는 부품을 거절한다', () => {
    expect(() => calculate(akm, { muzzle: akm.parts[0].id })).toThrow('슬롯')
    expect(() => calculate(m4, { rear_grip: 'missing' })).toThrow('관측 파츠')
  })
  it('기본 수치가 없는 총기를 0점으로 표시하지 않는다', () => {
    const weapon = weapons.find(item => !item.base)!
    expect(calculate(weapon, {}).control.final).toBeNull()
  })
  it('정밀 보정 사례를 기본 효과에 더하지 않는다', () => {
    expect(akm.calibrations.length).toBe(12)
    expect(calculate(akm, {}).control.final).toBe(39)
    expect(calculate(akm, {}).control.knownDelta).toBe(0)
  })
})
