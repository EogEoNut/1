import { baseStatKeys, warfareStatKeys } from '../types/warfare'
import type { Evidence, WarfareCatalog } from '../types/warfare'

function fail(message: string): never { throw new Error(`전면전 자료 검증: ${message}`) }
function validDate(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}
function validateEvidence(evidence: Evidence) {
  if (!['verified', 'observed', 'unknown', 'sample'].includes(evidence.status)) fail('알 수 없는 검증 상태')
  if (evidence.status === 'sample') fail('샘플 출처를 전면전 자료에 혼합할 수 없음')
  if (evidence.sourceUrl !== null) {
    let url: URL
    try { url = new URL(evidence.sourceUrl) } catch { fail('잘못된 출처 URL') }
    if (url!.protocol !== 'https:' || url!.username || url!.password) fail('출처는 인증정보 없는 HTTPS URL이어야 함')
  }
  if (evidence.observedAt !== null && !validDate(evidence.observedAt)) fail('잘못된 자료 확인일')
  if (evidence.status !== 'unknown' && (!evidence.sourceUrl || !evidence.observedAt)) fail('관측/검증 자료에는 출처와 확인일이 필요함')
  if (evidence.status === 'verified') {
    if (!evidence.gameVerified || !validDate(evidence.verifiedAt) || !evidence.gameVersion || evidence.kind !== 'game-test') fail('게임 검증에는 버전·검증일·게임 확인 근거가 필요함')
  } else if (evidence.gameVerified || evidence.verifiedAt !== null) fail('미검증 자료를 게임 검증 완료로 표시할 수 없음')
}
function unique(values: string[], label: string) {
  if (values.some(value => !value) || new Set(values).size !== values.length) fail(`${label} ID가 비어 있거나 중복됨`)
}
function finiteOrNull(value: unknown, label: string) {
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) fail(`${label}은 유한한 숫자 또는 null이어야 함`)
}

/** Validates adapters before any UI, calculator or recommendation consumes them. */
export function validateWarfareCatalog(catalog: WarfareCatalog): void {
  if (catalog.schemaVersion !== 1 || catalog.dataset !== 'warfare' || catalog.mode !== 'Warfare') fail('잘못된 데이터셋 또는 모드')
  unique(catalog.weapons.map(item => item.id), '총기')
  unique(catalog.weapons.map(item => item.name), '총기 이름')
  unique(catalog.attachments.map(item => item.id), '부착물')
  const weapons = new Map(catalog.weapons.map(item => [item.id, item]))
  const parts = new Map(catalog.attachments.map(item => [item.id, item]))
  for (const part of catalog.attachments) {
    if (part.dataset !== 'warfare' || part.mode !== 'Warfare') fail('다른 모드/샘플 부착물 혼입')
    if (!part.name || !part.slot) fail('부착물 이름/슬롯 누락')
    if (part.sourceId !== null && (typeof part.sourceId !== 'string' || !part.sourceId)) fail('잘못된 부착물 소스 ID')
    validateEvidence(part.evidence)
    unique(part.observedWeaponIds, '부착물 관측 총기')
    for (const weaponId of part.observedWeaponIds) if (!weapons.has(weaponId)) fail('존재하지 않는 관측 총기')
    for (const [key, value] of Object.entries(part.deltas)) {
      if (!(warfareStatKeys as readonly string[]).includes(key)) fail(`알 수 없는 막대 능력치 ${key}`)
      finiteOrNull(value, key)
    }
  }
  for (const weapon of catalog.weapons) {
    if (weapon.dataset !== 'warfare' || weapon.mode !== 'Warfare') fail('다른 모드/샘플 총기 혼입')
    validateEvidence(weapon.evidence)
    if (weapon.sourceId !== null && (typeof weapon.sourceId !== 'string' || !weapon.sourceId)) fail('잘못된 총기 소스 ID')
    if (weapon.base) {
      if (!weapon.baseEvidence) fail('총기 기본값의 출처 누락')
      for (const key of baseStatKeys) finiteOrNull(weapon.base[key], key)
    }
    if (weapon.baseEvidence) validateEvidence(weapon.baseEvidence)
    unique(weapon.slots.map(slot => slot.id), '슬롯')
    unique(weapon.parts.map(part => part.id), '총기 부착물')
    for (const slot of weapon.slots) {
      validateEvidence(slot.evidence)
      if (!['unknown', 'observed', 'verified'].includes(slot.defaultStatus)) fail('잘못된 기본 부품 상태')
      if (slot.defaultStatus === 'unknown' && slot.defaultAttachmentId !== null) fail('미확인 기본 부품을 지정할 수 없음')
      if (slot.defaultAttachmentId !== null && !weapon.parts.some(part => part.id === slot.defaultAttachmentId && part.slot === slot.id)) fail('알 수 없거나 다른 슬롯의 기본 부착물')
    }
    for (const part of weapon.parts) {
      if (parts.get(part.id) !== part) fail('총기 부착물이 카탈로그 원본과 일치하지 않음')
      if (!part.observedWeaponIds.includes(weapon.id) || !weapon.slots.some(slot => slot.id === part.slot)) fail('총기-슬롯-부착물 관측 참조 불일치')
    }
    for (const part of catalog.attachments) {
      if (part.observedWeaponIds.includes(weapon.id) && !weapon.parts.includes(part)) fail('관측 총기의 역방향 부착물 참조 누락')
    }
    unique(weapon.observedCombinations.map(group => group.id), '관측 조합')
    for (const group of weapon.observedCombinations) {
      validateEvidence(group.evidence)
      if (group.weaponId !== weapon.id) fail('관측 조합의 총기 불일치')
      unique(group.attachmentIds, '조합 부착물')
      const members = group.attachmentIds.map(id => weapon.parts.find(part => part.id === id))
      if (members.some(member => !member)) fail('조합 부착물 참조 누락')
      unique(members.map(member => member!.slot), '조합 슬롯')
    }
    for (const rule of weapon.compatibilityRules) {
      validateEvidence(rule.evidence)
      if (!['excludes', 'requires'].includes(rule.kind) || rule.weaponId !== weapon.id || rule.fromId === rule.toId
        || !weapon.parts.some(part => part.id === rule.fromId) || !weapon.parts.some(part => part.id === rule.toId)) fail('잘못된 충돌/종속 규칙')
      if (rule.evidence.status === 'unknown') fail('미확인 규칙을 강제 조건으로 사용할 수 없음')
    }
    for (const calibration of weapon.calibrations) {
      if (calibration.kind !== 'calibration-example') fail('정밀 보정과 기본 효과 혼합')
      finiteOrNull(calibration.delta, '정밀 보정')
    }
  }
}
