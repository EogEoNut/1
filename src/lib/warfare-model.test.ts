import { describe, expect, it } from 'vitest'
import { warfareCatalog, parseObservedNumber } from './warfare-data'
import { validateWarfareCatalog } from './warfare-validation'
import { assessAttachmentChange, assessLoadout, removeAttachmentCascade } from './compatibility'
import { calculateWarfare } from './warfare-calculator'
import { recommendationReadiness, scoreVerifiedMetrics } from './recommendation'
import type { Evidence, WarfareCatalog, WarfareWeapon } from '../types/warfare'

const m4 = warfareCatalog.weapons.find(item => item.name === 'M4A1')!
const akm = warfareCatalog.weapons.find(item => item.name === 'AKM')!
const findPart = (name: string) => akm.parts.find(part => part.name === name)!
const foregrip = findPart('X25U Angled Combat Grip')
const standardStock = findPart('MRGS Skeleton Stock')
const hipfireStock = findPart('QR High-Performance Stock')
const muzzle = findPart('Sandstorm Vertical Compensator')
const load = (...parts: typeof akm.parts) => Object.fromEntries(parts.map(part => [part.slot, part.id]))

describe('검증 상태와 원자료 정규화', () => {
  it('로컬 ID와 미확인 슬롯/기본 부품을 사이트 ID로 가장하지 않는다', () => {
    expect(warfareCatalog.attachments).toHaveLength(25)
    for (const weapon of warfareCatalog.weapons) {
      expect(weapon.sourceId).toBeNull()
      expect(weapon.evidence.status).toBe('observed')
      expect(weapon.evidence.gameVersion).toBeNull()
      expect(weapon.coverage.slotsComplete).toBe(false)
      for (const slot of weapon.slots) {
        expect(slot.defaultAttachmentId).toBeNull()
        expect(slot.defaultStatus).toBe('unknown')
      }
    }
    expect(akm.observedCombinations.map(item => item.id)).toEqual(['aimsector:AKM:standard', 'aimsector:AKM:hipfire'])
  })
  it.each(['', '  ', true, false, null, undefined, [], {}, 'NaN', Infinity])('잘못된 수치를 0으로 바꾸지 않는다: %j', value => {
    expect(parseObservedNumber(value)).toBeNull()
  })
  it('관측된 0과 음수는 그대로 유지한다', () => {
    expect(parseObservedNumber('0')).toBe(0)
    expect(parseObservedNumber('-4')).toBe(-4)
  })
})

describe('전면전 참조 무결성 검사', () => {
  const checkCorruption = (change: (catalog: WarfareCatalog) => void, message: RegExp) => {
    const invalid = structuredClone(warfareCatalog)
    change(invalid)
    expect(() => validateWarfareCatalog(invalid)).toThrow(message)
  }
  it('중복 ID를 거절한다', () => checkCorruption(catalog => catalog.attachments.push(catalog.attachments[0]), /중복/))
  it('다른 모드나 샘플 상태가 섞이는 것을 거절한다', () => {
    checkCorruption(catalog => { Object.assign(catalog.attachments[0], { mode: 'Operations' }) }, /다른 모드/)
    checkCorruption(catalog => { Object.assign(catalog.attachments[0].evidence, { status: 'sample' }) }, /샘플 출처/)
  })
  it('관측 상태에 게임 검증 완료 표시를 붙일 수 없다', () => {
    checkCorruption(catalog => { Object.assign(catalog.attachments[0].evidence, { gameVerified: true }) }, /미검증 자료/)
    checkCorruption(catalog => { Object.assign(catalog.attachments[0].evidence, { status: 'verified', gameVerified: true, verifiedAt: '2026-10-27' }) }, /게임 검증/)
  })
  it('부품-총기 참조와 슬롯, 기본 장착 부품을 검사한다', () => {
    checkCorruption(catalog => { catalog.attachments[0].observedWeaponIds = ['missing'] }, /존재하지 않는/)
    checkCorruption(catalog => { catalog.attachments[0].slot = 'nonexistent-slot' }, /참조 불일치/)
    checkCorruption(catalog => {
      const slot = catalog.weapons.find(weapon => weapon.slots.length)!.slots[0]
      slot.defaultAttachmentId = 'missing'
      slot.defaultStatus = 'observed'
    }, /기본 부착물/)
  })
  it('비유한 수치와 잘못된 실제 날짜를 검사한다', () => {
    checkCorruption(catalog => { catalog.attachments[0].deltas.control = Number.NaN }, /유한한 숫자/)
    checkCorruption(catalog => { catalog.attachments[0].evidence.observedAt = '2026-02-30' }, /자료 확인일/)
  })
  it('잘못된 관측 조합 및 충돌 규칙의 참조를 검사한다', () => {
    checkCorruption(catalog => { catalog.weapons.find(weapon => weapon.name === 'AKM')!.observedCombinations[0].attachmentIds.push('missing') }, /조합 부착물/)
    checkCorruption(catalog => {
      const weapon = catalog.weapons.find(item => item.name === 'AKM')!
      weapon.compatibilityRules.push({ weaponId: weapon.id, kind: 'excludes', fromId: foregrip.id, toId: 'missing', evidence: foregrip.evidence })
    }, /충돌\/종속/)
  })
})

describe('보수적 호환성 검사', () => {
  it('같은 슬롯의 부품은 교체하며 기존 부품과 중복으로 보지 않는다', () => {
    expect(assessAttachmentChange(m4, load(m4.parts[0]), m4.parts[1]).status).toBe('allowed')
  })
  it('같은 공개 빌드 관측은 허용하되 다른 빌드 혼합은 미확인으로 구분한다', () => {
    expect(assessLoadout(akm, load(foregrip, standardStock))).toMatchObject({ status: 'allowed', evidenceStatus: 'observed' })
    expect(assessLoadout(akm, load(foregrip, hipfireStock)).status).toBe('unknown')
    expect(() => calculateWarfare(akm, load(foregrip, hipfireStock))).toThrow('동시 장착 근거')
  })
  it('쌍별 관측만으로 세 부품 전체 조합을 추정하지 않는다', () => {
    const weapon = structuredClone(akm)
    const pairs = [[foregrip, standardStock], [foregrip, muzzle], [standardStock, muzzle]]
    weapon.observedCombinations = pairs.map((pair, i) => ({ id: `pair-${i}`, weaponId: weapon.id, attachmentIds: pair.map(part => part.id), evidence: foregrip.evidence }))
    expect(assessLoadout(weapon, load(foregrip, standardStock, muzzle)).status).toBe('unknown')
  })
  it('명시적인 상호 배제는 양방향으로 막는다 (가상 규칙 테스트)', () => {
    const weapon = structuredClone(akm)
    weapon.compatibilityRules.push({ weaponId: weapon.id, kind: 'excludes', fromId: foregrip.id, toId: standardStock.id, evidence: foregrip.evidence })
    expect(assessLoadout(weapon, load(foregrip, standardStock)).status).toBe('blocked')
    expect(assessLoadout(weapon, load(standardStock, foregrip)).status).toBe('blocked')
  })
  it('선행 부품이 필요한 구성과 선행 부품 해제 시 종속 부품을 처리한다 (가상 규칙 테스트)', () => {
    const weapon = structuredClone(akm)
    weapon.compatibilityRules.push({ weaponId: weapon.id, kind: 'requires', fromId: foregrip.id, toId: muzzle.id, evidence: foregrip.evidence })
    expect(assessLoadout(weapon, load(foregrip)).status).toBe('blocked')
    expect(assessLoadout(weapon, load(foregrip, muzzle)).status).toBe('allowed')
    expect(removeAttachmentCascade(weapon, load(foregrip, muzzle), muzzle.slot)).toEqual({})
  })
  it('해당 총기 기록에 없는 부품은 장착 불가라고 단정하지 않는다', () => {
    expect(assessLoadout(m4, { muzzle: foregrip.id })).toMatchObject({ status: 'unknown' })
    expect(assessLoadout(m4, { muzzle: m4.parts[0].id }).status).toBe('blocked')
    expect(assessLoadout(m4, {}).evidenceStatus).toBe('observed')
  })
})

describe('참고 계산과 기여도', () => {
  it('변화량 0과 미확인을 구분하며 계산 방법을 표시한다', () => {
    const part = m4.parts.find(item => item.name === '416实用后握把')!
    const result = calculateWarfare(m4, load(part))
    expect(result.control).toMatchObject({ method: 'reference-additive', status: 'observed', final: 41, delta: 0 })
    expect(result.control.contributions[0].amount).toBe(0)
    expect(calculateWarfare(akm, load(foregrip)).control.contributions[0].amount).toBeNull()
  })
  it('미확인 기본값 출처와 큰 막대 값을 가상의 게임 공식으로 보정하지 않는다', () => {
    const weapon: WarfareWeapon = structuredClone(m4)
    weapon.base!.control = 99
    const part = weapon.parts.find(item => item.name === 'AR MOE后握把')!
    expect(calculateWarfare(weapon, load(part)).control.final).toBe(102)
    weapon.baseEvidence = { ...weapon.baseEvidence!, status: 'unknown', gameVerified: false, verifiedAt: null } as Evidence
    expect(calculateWarfare(weapon, load(part)).control.final).toBeNull()
  })
})

describe('추천 기반의 데이터 제한과 자체 평가', () => {
  it('관측 자료로 미검증 추천을 내지 않는다', () => {
    const result = recommendationReadiness(m4, 'recoil')
    expect(result.ready).toBe(false)
    expect(result.recommendations).toEqual([])
    expect(result.reasons).toContain('검증된 게임 계산 전략이 아직 연결되지 않았습니다.')
  })
  it('관측 수치를 게임 검증된 점수 입력으로 사용할 수 없다', () => {
    expect(scoreVerifiedMetrics('recoil', { control: { base: 40, value: 50, status: 'observed' } })).toBeNull()
  })
  it('자체 점수는 선호도에 따라 평가하고 부족한 입력으로 순위를 만들지 않는다', () => {
    const controlBuild = { control: { base: 50, value: 58, status: 'verified' as const }, handling: { base: 50, value: 50, status: 'verified' as const }, stability: { base: 50, value: 50, status: 'verified' as const } }
    const handlingBuild = { ...controlBuild, control: { ...controlBuild.control, value: 50 }, handling: { ...controlBuild.handling, value: 58 } }
    expect(scoreVerifiedMetrics('recoil', controlBuild)!).toBeGreaterThan(scoreVerifiedMetrics('recoil', handlingBuild)!)
    expect(scoreVerifiedMetrics('balanced', handlingBuild)!).toBeGreaterThan(scoreVerifiedMetrics('balanced', controlBuild)!)
    expect(scoreVerifiedMetrics('mobility', controlBuild)).toBeNull()
  })
})
