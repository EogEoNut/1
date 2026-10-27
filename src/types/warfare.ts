export type VerificationStatus = 'verified' | 'observed' | 'unknown' | 'sample'
export const warfareStatKeys = ['control', 'handling', 'stability', 'accuracy'] as const
export type WarfareStat = typeof warfareStatKeys[number]
export const baseStatKeys = [...warfareStatKeys, 'damage', 'range_m', 'rpm', 'capacity', 'ads_ms', 'sprint_to_fire_ms', 'ads_move_mps'] as const
export type BaseStat = typeof baseStatKeys[number]

interface EvidenceBase {
  sourceUrl: string | null
  observedAt: string | null
  sourceName: string
  kind: 'site-listed' | 'published-build' | 'site-base' | 'unknown' | 'game-test'
  gameVersion: string | null
  dataVersion: string | null
}
export type Evidence = EvidenceBase & (
  | { status: 'verified'; gameVerified: true; verifiedAt: string }
  | { status: 'observed' | 'unknown' | 'sample'; gameVerified: false; verifiedAt: null }
)

export interface WarfarePart {
  id: string
  sourceId: string | null
  dataset: 'warfare'
  mode: 'Warfare'
  name: string
  slot: string
  observedWeaponIds: string[]
  deltas: Partial<Record<WarfareStat, number | null>>
  source: string
  note: string
  evidence: Evidence
  /** Null means no supported tuning capability/range has been established. */
  tunable: boolean | null
}
export interface KnownSlot {
  id: string
  defaultAttachmentId: string | null
  defaultStatus: VerificationStatus
  evidence: Evidence
}
export interface ObservedCombination {
  id: string
  weaponId: string
  attachmentIds: string[]
  evidence: Evidence
}
export interface CompatibilityRule {
  weaponId: string
  kind: 'excludes' | 'requires'
  fromId: string
  toId: string
  evidence: Evidence
}
export interface Calibration {
  attachment: string
  stat: string
  unit: string
  delta: number | null
  sourceUrl: string
  kind: 'calibration-example'
}
export interface WarfareWeapon {
  id: string
  sourceId: string | null
  dataset: 'warfare'
  mode: 'Warfare'
  name: string
  category: string | null
  evidence: Evidence
  base: Record<BaseStat, number | null> | null
  baseEvidence: Evidence | null
  slots: KnownSlot[]
  coverage: { slotsComplete: boolean; compatibilityComplete: boolean }
  codes: { code: string; label: string }[]
  parts: WarfarePart[]
  calibrations: Calibration[]
  observedCombinations: ObservedCombination[]
  compatibilityRules: CompatibilityRule[]
}
export interface WarfareCatalog {
  schemaVersion: 1
  dataset: 'warfare'
  mode: 'Warfare'
  weapons: WarfareWeapon[]
  attachments: WarfarePart[]
}
export type WarfareLoadout = Record<string, string>
export interface CompatibilityResult {
  status: 'allowed' | 'blocked' | 'unknown'
  reason: string
  evidenceStatus: VerificationStatus
}
export interface StatContribution {
  attachmentId: string
  name: string
  amount: number | null
  status: VerificationStatus
}
export interface WarfareStatResult {
  base: number | null
  knownDelta: number
  final: number | null
  delta: number | null
  unknownCount: number
  method: 'reference-additive'
  status: 'observed' | 'unknown'
  contributions: StatContribution[]
}
