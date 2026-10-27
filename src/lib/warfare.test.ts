import { describe, expect, it } from 'vitest'
import { calculate, metadata, weapons } from './warfare'

const m4 = weapons.find(weapon => weapon.name === 'M4A1')!
const akm = weapons.find(weapon => weapon.name === 'AKM')!

describe('출처 기반 전면전 자료', () => {
  it('목록과 출처를 구분하고 원자료 확인일을 유지한다', () => {
    expect(new Set(weapons.map(weapon => weapon.name)).size).toBe(weapons.length)
    expect(metadata.weaponCount).toBe(66)
    expect(metadata.dfttkPartCount).toBe(9)
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
  it('빈 기본값을 0으로 바꾸지 않고 원래 물리 단위를 보존한다', () => {
    expect(m4.base?.damage).toBeNull()
    expect(m4.base?.range_m).toBe(25)
    expect(m4.base?.rpm).toBe(800)
    expect(m4.base?.capacity).toBe(30)
    expect(m4.base?.sprint_to_fire_ms).toBe(209)
    expect(m4.base?.ads_move_mps).toBe(2.188)
  })
  it('DFTTK의 M4A1 관측을 다른 총기 호환성으로 확대하지 않는다', () => {
    const part = m4.parts.find(item => item.evidence.sourceName === 'DFTTK')!
    expect(() => calculate(akm, { [part.slot]: part.id })).toThrow('관측 파츠')
  })
  it('표시 변화량을 합산하되 기본 자료와 부착물을 변경하지 않는다', () => {
    const part = m4.parts.find(item => item.name === '416实用后握把')!
    const before = structuredClone(m4)
    const result = calculate(m4, { [part.slot]: part.id })
    expect(result.control.final).toBe(41)
    expect(result.handling.final).toBe(60)
    expect(result.stability.final).toBe(57)
    expect(m4).toEqual(before)
  })
  it('수치가 없는 부착물은 최종 참고값을 미확인으로 표시한다', () => {
    const part = akm.parts[0]
    const result = calculate(akm, { [part.slot]: part.id })
    expect(result.control.base).toBe(39)
    expect(result.control.final).toBeNull()
    expect(result.control.unknownCount).toBe(1)
  })
  it('잘못된 슬롯과 총기 기록에 없는 부품을 거절한다', () => {
    expect(() => calculate(m4, { muzzle: m4.parts[0].id })).toThrow('슬롯')
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
