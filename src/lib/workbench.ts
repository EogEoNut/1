import { catalog } from '../data/catalog'
import { weapons } from './warfare'
import type { Weapon } from '../types'
import type { WarfareWeapon } from '../types/warfare'

export type DatasetFilter = 'all' | 'warfare' | 'sample'
interface EntryLabel { id: string; name: string; category: string; searchText: string }
export type WorkbenchEntry = EntryLabel & (
  | { kind: 'sample'; weapon: Weapon }
  | { kind: 'warfare'; weapon: WarfareWeapon }
)
const categoryLabels: Record<string, string> = {
  assault_rifle: '돌격소총', battle_rifle: '전투소총', lmg: '경기관총', marksman: '지정사수소총',
  pistol: '권총', shotgun: '산탄총', smg: '기관단총', sniper: '저격소총', special: '특수 무기',
}
const priority = (name: string) => name === 'M4A1' ? 0 : name === 'AKM' ? 1 : 2

/** Presentation index only. Source and sample values never share a calculation model. */
export const workbenchWeapons: WorkbenchEntry[] = [
  ...[...weapons].sort((a, b) => priority(a.name) - priority(b.name)).map((weapon): WorkbenchEntry => {
    const category = weapon.category ? categoryLabels[weapon.category] ?? weapon.category : '종류 미확인'
    return { id: weapon.id, kind: 'warfare', weapon, name: weapon.name, category,
      searchText: `${weapon.name} ${category} ${weapon.category ?? ''}` }
  }),
  ...catalog.weapons.map((weapon): WorkbenchEntry => ({ id: `sample:${weapon.id}`, kind: 'sample', weapon,
    name: weapon.name, category: weapon.category, searchText: `${weapon.name} ${weapon.category} ${weapon.subtitle}` })),
]
export const initialWorkbenchWeapon = workbenchWeapons.find(entry => entry.kind === 'warfare' && entry.name === 'M4A1')!
export function filterWorkbenchWeapons(dataset: DatasetFilter, search: string, category: string) {
  const query = search.trim().toLowerCase()
  return workbenchWeapons.filter(entry => (dataset === 'all' || entry.kind === dataset)
    && (category === '전체' || entry.category === category) && entry.searchText.toLowerCase().includes(query))
}
export function workbenchCategories(dataset: DatasetFilter) {
  return [...new Set(workbenchWeapons.filter(entry => dataset === 'all' || entry.kind === dataset).map(entry => entry.category))]
}
