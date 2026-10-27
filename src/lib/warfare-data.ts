import seed from '../data/warfare_seed.json'
import { baseStatKeys } from '../types/warfare'
import type { Evidence, WarfareCatalog, WarfarePart, WarfareWeapon } from '../types/warfare'
import { validateWarfareCatalog } from './warfare-validation'

export function parseObservedNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
function observed(sourceUrl: string, sourceName: string, kind: Evidence['kind'], observedAt = seed.manifest.as_of, dataVersion = seed.manifest.season): Evidence {
  return { status: 'observed', sourceUrl, sourceName, kind, observedAt, dataVersion,
    gameVersion: null, gameVerified: false, verifiedAt: null }
}
const localWeaponId = (name: string) => `warfare:${name}`
const parts = new Map<string, WarfarePart>()
const byWeapon = new Map<string, Set<string>>()
function associate(name: string, part: WarfarePart) {
  if (!seed.weapons.includes(name)) throw new Error(`관측 총기 이름을 찾을 수 없습니다: ${name}`)
  if (!byWeapon.has(name)) byWeapon.set(name, new Set())
  if (byWeapon.get(name)!.has(part.id)) throw new Error(`중복 관측 참조: ${name}/${part.id}`)
  byWeapon.get(name)!.add(part.id)
  part.observedWeaponIds.push(localWeaponId(name))
}
const akmRows = seed.confirmed_akm_attachment_examples.filter(row => row.mode === 'Warfare')
for (const [index, raw] of akmRows.entries()) {
  const part: WarfarePart = {
    id: `akm:${index}`, sourceId: null, dataset: 'warfare', mode: 'Warfare', name: raw.attachment,
    slot: raw.slot, observedWeaponIds: [], deltas: {}, source: 'Aim Sector 전면전 예시',
    note: raw.effect_description, tunable: null,
    evidence: observed(raw.source_url, 'Aim Sector', 'published-build'),
  }
  if (parts.has(part.id)) throw new Error(`부착물 ID 중복: ${part.id}`)
  parts.set(part.id, part)
  associate(raw.weapon, part)
}
const baseRows = seed.verified_weapon_base_partial.filter(row => row.mode === 'Warfare')
if (new Set(baseRows.map(row => row.weapon)).size !== baseRows.length || baseRows.some(row => !seed.weapons.includes(row.weapon))) throw new Error('기본 수치의 총기 참조가 중복되거나 존재하지 않습니다.')
const bases = new Map(baseRows.map(row => [row.weapon, row]))

const weapons: WarfareWeapon[] = seed.weapons.map(name => {
  const id = localWeaponId(name)
  const base = bases.get(name)
  const members = [...(byWeapon.get(name) ?? [])].map(partId => parts.get(partId)!)
  const loadouts = seed.loadouts.filter(row => row.mode === 'Warfare' && row.weapon === name)
  const categories = [...new Set(loadouts.map(row => row.category))]
  const groupNames = name === 'AKM' ? [...new Set(akmRows.flatMap(row => row.confirmed_in_build.split(';')))] : []
  return {
    id, sourceId: null, dataset: 'warfare', mode: 'Warfare', name,
    category: categories.length === 1 ? categories[0] : null,
    evidence: observed('https://www.aimsector.com/news/delta-force-loadouts', 'Aim Sector', 'site-listed'),
    base: base ? Object.fromEntries(baseStatKeys.map(key => [key, parseObservedNumber(base[key as keyof typeof base])])) as WarfareWeapon['base'] : null,
    baseEvidence: base ? observed(base.source_url, 'Aim Sector', 'site-base', base.observed_at) : null,
    slots: [...new Set(members.map(part => part.slot))].map(slot => ({
      id: slot, defaultAttachmentId: null, defaultStatus: 'unknown',
      evidence: members.find(part => part.slot === slot)!.evidence,
    })),
    coverage: { slotsComplete: false, compatibilityComplete: false },
    codes: loadouts.map(row => ({ code: row.loadout_code, label: row.build_label })),
    parts: members,
    calibrations: seed.akm_tuned_calibration_examples.filter(row => row.mode === 'Warfare' && row.weapon === name).map(row => ({
      attachment: row.attachment, stat: row.stat, unit: row.unit, delta: parseObservedNumber(row.delta),
      sourceUrl: row.source_url, kind: 'calibration-example',
    })),
    observedCombinations: groupNames.map(group => ({
      id: `aimsector:${name}:${group}`, weaponId: id,
      attachmentIds: akmRows.flatMap((row, index) => row.confirmed_in_build.split(';').includes(group) ? [`akm:${index}`] : []),
      evidence: observed('https://www.aimsector.com/news/delta-force-akm-build', 'Aim Sector', 'published-build'),
    })),
    compatibilityRules: [],
  }
})

export const warfareCatalog: WarfareCatalog = { schemaVersion: 1, dataset: 'warfare', mode: 'Warfare', weapons, attachments: [...parts.values()] }
validateWarfareCatalog(warfareCatalog)
