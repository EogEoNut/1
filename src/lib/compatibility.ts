import type { CompatibilityResult, WarfareLoadout, WarfarePart, WarfareWeapon } from '../types/warfare'

function result(status: CompatibilityResult['status'], reason: string, evidenceStatus: CompatibilityResult['evidenceStatus'] = 'unknown'): CompatibilityResult {
  return { status, reason, evidenceStatus }
}
/** Missing compatibility evidence is unknown, never proof of incompatibility. */
export function assessLoadout(weapon: WarfareWeapon, selection: WarfareLoadout): CompatibilityResult {
  if (weapon.dataset !== 'warfare' || weapon.mode !== 'Warfare' || weapon.evidence.status === 'sample') return result('blocked', '샘플 또는 다른 모드의 자료입니다.')
  const selected: WarfarePart[] = []
  for (const [slot, id] of Object.entries(selection)) {
    const part = weapon.parts.find(item => item.id === id)
    if (!part) return result('unknown', '해당 총기의 관측 파츠 기록이 없습니다. 장착 불가를 뜻하지는 않습니다.')
    if (part.slot !== slot) return result('blocked', '부착물 슬롯이 일치하지 않습니다.')
    if (part.dataset !== 'warfare' || part.mode !== 'Warfare' || part.evidence.status === 'sample') return result('blocked', '샘플 또는 다른 모드의 부착물입니다.')
    if (!part.observedWeaponIds.includes(weapon.id) || !weapon.slots.some(item => item.id === slot) || part.evidence.status === 'unknown') return result('unknown', '총기와 슬롯의 호환 관측 근거가 없습니다.')
    selected.push(part)
  }
  const ids = new Set(selected.map(part => part.id))
  for (const rule of weapon.compatibilityRules) {
    if (rule.weaponId !== weapon.id) continue
    if (rule.evidence.status !== 'observed' && rule.evidence.status !== 'verified') continue
    if (rule.kind === 'excludes' && ids.has(rule.fromId) && ids.has(rule.toId)) return result('blocked', '출처에서 동시에 장착할 수 없는 것으로 확인된 부품입니다.', rule.evidence.status)
    if (rule.kind === 'requires' && ids.has(rule.fromId) && !ids.has(rule.toId)) return result('blocked', '이 부착물에 필요한 선행 부품을 먼저 선택하세요.', rule.evidence.status)
  }
  if (!selected.length) return result('allowed', '선택한 부착물이 없습니다. 기본 구성의 세부 부품은 별도 확인이 필요합니다.', weapon.baseEvidence?.status ?? weapon.evidence.status)
  if (selected.length === 1) return result('allowed', '해당 총기·슬롯에서 관측된 부품을 참고용으로 선택할 수 있습니다.', selected.every(part => part.evidence.status === 'verified' && weapon.slots.find(slot => slot.id === part.slot)?.evidence.status === 'verified') ? 'verified' : 'observed')
  const group = weapon.observedCombinations.find(item => item.weaponId === weapon.id && ['observed', 'verified'].includes(item.evidence.status) && selected.every(part => item.attachmentIds.includes(part.id)))
  if (group) return result('allowed', '같은 공개 빌드에서 함께 관측된 구성입니다. 게임 내 검증 여부는 별개입니다.', group.evidence.status)
  if (weapon.coverage.compatibilityComplete && weapon.evidence.status === 'verified' && selected.every(part => part.evidence.status === 'verified')) return result('allowed', '검증된 전체 호환성 규칙을 통과했습니다.', 'verified')
  return result('unknown', '이 부품들의 동시 장착 근거가 없습니다. 확인된 조합이 아니므로 선택을 보류합니다.')
}

export function assessAttachmentChange(weapon: WarfareWeapon, selection: WarfareLoadout, part: WarfarePart): CompatibilityResult {
  return assessLoadout(weapon, { ...selection, [part.slot]: part.id })
}

export function assertLoadout(weapon: WarfareWeapon, selection: WarfareLoadout): void {
  const assessment = assessLoadout(weapon, selection)
  if (assessment.status !== 'allowed') throw new Error(assessment.reason)
}

/** Removing a prerequisite also removes known dependants; unknown rules are never invented. */
export function removeAttachmentCascade(weapon: WarfareWeapon, selection: WarfareLoadout, slot: string): WarfareLoadout {
  const next = { ...selection }
  delete next[slot]
  let changed = true
  while (changed) {
    changed = false
    const selectedIds = new Set(Object.values(next))
    for (const rule of weapon.compatibilityRules) {
      if (rule.weaponId !== weapon.id) continue
      if (rule.kind !== 'requires' || !['observed', 'verified'].includes(rule.evidence.status)) continue
      if (selectedIds.has(rule.fromId) && !selectedIds.has(rule.toId)) {
        for (const [key, id] of Object.entries(next)) if (id === rule.fromId) { delete next[key]; changed = true }
      }
    }
  }
  assertLoadout(weapon, next)
  return next
}
