import { describe, expect, it } from 'vitest'
import { baseStatKeys } from '../types/warfare'
import database from '../data/warfare_namuwiki.json'
import { loadWarfareCatalog, warfareCatalog } from './warfare-data'
import { calculate, metadata } from './warfare'
import { mathFixture } from './test-fixtures/warfare'

describe('독립 전면전 기본 데이터베이스', () => {
  it('접근 실패를 관측 성공으로 가장하지 않고 총기 등록을 보류한다', () => {
    expect(database.source.accessStatus).toBe('blocked')
    expect(database.source.observedAt).toBeNull()
    expect(database.source.gameVersion).toBeNull()
    expect(database.source.license.status).toBe('unconfirmed')
    expect(warfareCatalog.weapons).toEqual([])
    expect(warfareCatalog.attachments).toEqual([])
    expect(metadata).toMatchObject({ weaponCount: 0, baseCount: 0, attachmentRecordCount: 0, date: null, season: null })
  })
  it('제거된 출처의 자료와 코드가 새 데이터에 남아 있지 않다', () => {
    expect(JSON.stringify(database)).not.toMatch(/aim[ -]?sector|dfttk/i)
    expect(JSON.stringify(warfareCatalog)).not.toMatch(/aim[ -]?sector|dfttk/i)
  })
  it('새 레코드의 null과 0 및 단위를 보존한다 (외부 자료가 아닌 테스트 입력)', () => {
    const weapon = mathFixture()
    weapon.parts = []
    weapon.slots = []
    weapon.base!.damage = 0
    weapon.base!.muzzle_velocity_mps = 123
    weapon.fireModes = ['단발', '연사']
    const result = loadWarfareCatalog({ ...database, weapons: [weapon] }).weapons[0]
    expect(result.base!.damage).toBe(0)
    expect(result.base!.muzzle_velocity_mps).toBe(123)
    expect(result.base!.capacity).toBeNull()
    expect(result.nameEn).toBe('Synthetic fixture')
    expect(result.fireModes).toEqual(['단발', '연사'])
  })
  it('중복 이름 정규화, 누락된 단위 필드 및 다른 모드를 검사한다', () => {
    const a = mathFixture()
    const b = { ...mathFixture(), id: 'fixture:other', name: '계산검사전용' }
    expect(() => loadWarfareCatalog({ ...database, weapons: [a, b] })).toThrow('총기 이름')
    const missing = mathFixture()
    delete (missing.base as Partial<typeof missing.base>)!.muzzle_velocity_mps
    expect(() => loadWarfareCatalog({ ...database, weapons: [missing] })).toThrow('유한한 숫자')
    expect(() => loadWarfareCatalog({ ...database, mode: 'Operations' })).toThrow('모드')
    expect(() => loadWarfareCatalog({ ...database, weapons: [{ ...a, mode: 'Operations' }] })).toThrow('다른 모드')
  })
  it('사격 모드와 한국어/영어 이름을 추측 없이 검사한다', () => {
    expect(() => loadWarfareCatalog({ ...database, weapons: [{ ...mathFixture(), fireModes: '' }] })).toThrow('사격 모드')
    expect(() => loadWarfareCatalog({ ...database, weapons: [{ ...mathFixture(), nameKo: 0 }] })).toThrow('한국어/영어')
  })
  it('참고 합산과 미확인 수치를 유지한다', () => {
    const fixture = mathFixture()
    const before = structuredClone(fixture)
    const part = fixture.parts[0]
    const result = calculate(fixture, { [part.slot]: part.id })
    expect(result.control.final).toBe(20)
    expect(result.handling.final).toBe(34)
    expect(result.stability.final).toBe(38)
    expect(fixture).toEqual(before)
    fixture.base = Object.fromEntries(baseStatKeys.map(key => [key, null])) as typeof fixture.base
    expect(calculate(fixture, {}).control.final).toBeNull()
  })
})
