import seed from '../data/warfare_seed.json'
import { warfareCatalog } from './warfare-data'
export { warfareCatalog } from './warfare-data'
export { calculateWarfare as calculate } from './warfare-calculator'
export { warfareStatKeys as statKeys } from '../types/warfare'
export type { Evidence, WarfarePart as Part, WarfareWeapon as Weapon, Calibration, WarfareStat as Stat } from '../types/warfare'

/** Compatibility facade for existing components; raw JSON remains unchanged. */
export const weapons = warfareCatalog.weapons
export const statNames = { control: '반동 제어', handling: '조작 속도', stability: '안정성', accuracy: '지향 정밀도' }
export const slotNames: Record<string, string> = {
  rear_grip: '후방 손잡이', foregrip: '전방 손잡이', barrel: '총열', muzzle: '총구', stock: '개머리판',
  magazine: '탄창', mag_mount: '탄창 보조', right_rail: '우측 레일', left_patch: '좌측 패널',
  right_patch: '우측 패널', upper_rail: '상단 레일', charging_handle: '장전 손잡이', tactical_device: '전술 장비',
}
export const specDefinitions = [
  { key: 'damage', label: '자료 표시 피해량', unit: '' },
  { key: 'range_m', label: '자료 표시 사거리', unit: 'm' },
  { key: 'rpm', label: '발사 속도', unit: '발/분' },
  { key: 'capacity', label: '기본 장탄수', unit: '발' },
  { key: 'ads_ms', label: '조준 전환 시간', unit: 'ms' },
  { key: 'sprint_to_fire_ms', label: '질주 후 사격 전환', unit: 'ms' },
  { key: 'ads_move_mps', label: '조준 이동 속도', unit: 'm/s' },
] as const
export const metadata = {
  mode: 'Warfare', date: seed.manifest.as_of, season: seed.manifest.season, complete: false,
  weaponCount: weapons.length, baseCount: weapons.filter(weapon => weapon.base).length,
  dfttkPartCount: warfareCatalog.attachments.filter(part => part.evidence.sourceName === 'DFTTK').length,
  observedWeaponCount: weapons.filter(weapon => weapon.parts.some(part => part.evidence.sourceName === 'DFTTK')).length,
}
