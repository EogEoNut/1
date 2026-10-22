export const statKeys = ['control', 'handling', 'stability', 'mobility', 'range'] as const
export type StatKey = typeof statKeys[number]
export type Stats = Record<StatKey, number>
export type SlotId = 'barrel' | 'muzzle' | 'foregrip' | 'stock' | 'magazine' | 'optic'
export type Loadout = Partial<Record<SlotId, string>>

export interface Provenance {
  status: 'sample'
  source: string
  verifiedAt: null
  gameVersion: null
}
export interface Weapon {
  id: string
  name: string
  subtitle: string
  category: string
  description: string
  silhouette: 'rifle' | 'smg' | 'dmr'
  stats: Stats
  slots: SlotId[]
  provenance: Provenance
}
export interface Attachment {
  id: string
  name: string
  slot: SlotId
  description: string
  weaponIds: string[]
  modifiers: Partial<Stats>
  incompatibleWith: string[]
  provenance: Provenance
}
export interface Catalog {
  version: string
  notice: string
  statModel: {
    kind: 'sample-additive-clamped'
    min: number
    max: number
    unit: string
    description: string
  }
  weapons: Weapon[]
  attachments: Attachment[]
}
