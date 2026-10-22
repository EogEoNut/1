import { statKeys, type Attachment, type Loadout, type Stats, type Weapon } from '../types'

export function equippedParts(loadout: Loadout, attachments: Attachment[]): Attachment[] {
  return Object.values(loadout).flatMap(id => {
    const part = attachments.find(item => item.id === id)
    return part ? [part] : []
  })
}

export function compatibilityReason(weapon: Weapon, loadout: Loadout, part: Attachment, attachments: Attachment[]): string | null {
  if (!weapon.slots.includes(part.slot) || !part.weaponIds.includes(weapon.id)) return '이 총기에 장착할 수 없습니다.'
  const conflict = equippedParts(loadout, attachments).find(other =>
    other.slot !== part.slot && (part.incompatibleWith.includes(other.id) || other.incompatibleWith.includes(part.id)),
  )
  return conflict ? `${conflict.name} 장착 중: 함께 장착할 수 없습니다.` : null
}

export function calculateStats(weapon: Weapon, loadout: Loadout, attachments: Attachment[], bounds = { min: 0, max: 100 }): Stats {
  for (const id of Object.values(loadout)) {
    if (!attachments.some(part => part.id === id)) throw new Error('알 수 없는 부착물입니다.')
  }
  const result = { ...weapon.stats }
  const parts = equippedParts(loadout, attachments)
  for (const part of parts) {
    if (loadout[part.slot] !== part.id) throw new Error('부착물 슬롯이 일치하지 않습니다.')
    const reason = compatibilityReason(weapon, loadout, part, attachments)
    if (reason) throw new Error(reason)
  }
  for (const key of statKeys) {
    const sum = parts.reduce((value, part) => value + (part.modifiers[key] ?? 0), weapon.stats[key])
    result[key] = Math.min(bounds.max, Math.max(bounds.min, sum))
  }
  return result
}
