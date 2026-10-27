import { warfareStatKeys } from '../types/warfare'
import type { WarfareLoadout, WarfareStat, WarfareStatResult, WarfareWeapon } from '../types/warfare'
import { assertLoadout } from './compatibility'

/** No verified game formula is currently registered. Calibration is excluded. */
export function calculateWarfare(weapon: WarfareWeapon, selection: WarfareLoadout): Record<WarfareStat, WarfareStatResult> {
  assertLoadout(weapon, selection)
  const selected = Object.values(selection).map(id => weapon.parts.find(part => part.id === id)!)
  return Object.fromEntries(warfareStatKeys.map(key => {
    const base = weapon.base?.[key] ?? null
    const contributions = selected.map(part => ({
      attachmentId: part.id, name: part.name, amount: part.deltas[key] ?? null,
      status: part.deltas[key] == null ? 'unknown' as const : part.evidence.status,
    }))
    const unknownCount = contributions.filter(item => item.amount === null).length
    const knownDelta = contributions.reduce((sum, item) => sum + (item.amount ?? 0), 0)
    const baseKnown = weapon.baseEvidence?.status === 'observed' || weapon.baseEvidence?.status === 'verified'
    const final = base !== null && baseKnown && unknownCount === 0 ? base + knownDelta : null
    if (!Number.isFinite(knownDelta) || (final !== null && !Number.isFinite(final))) throw new Error('계산 결과가 유한한 숫자가 아닙니다.')
    return [key, { base, knownDelta, unknownCount, final, delta: final !== null && base !== null ? final - base : null,
      method: 'reference-additive', status: final === null ? 'unknown' : 'observed', contributions }]
  })) as Record<WarfareStat, WarfareStatResult>
}
