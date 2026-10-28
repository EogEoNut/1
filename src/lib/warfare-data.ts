import database from '../data/warfare_namuwiki.json'
import type { WarfareCatalog, WarfareWeapon } from '../types/warfare'
import { validateWarfareCatalog } from './warfare-validation'

/** Normalized records are independent from any site's build/code format. */
export function loadWarfareCatalog(input: unknown): WarfareCatalog {
  if (!input || typeof input !== 'object') throw new Error('전면전 데이터 파일이 객체여야 합니다.')
  const raw = input as Record<string, unknown>
  if (raw.schemaVersion !== 1 || raw.dataset !== 'warfare' || raw.mode !== 'Warfare' || !Array.isArray(raw.weapons)) {
    throw new Error('전면전 데이터 파일의 스키마 또는 모드가 올바르지 않습니다.')
  }
  const weapons = raw.weapons as WarfareWeapon[]
  const catalog: WarfareCatalog = { schemaVersion: 1, dataset: 'warfare', mode: 'Warfare', weapons,
    attachments: weapons.flatMap(weapon => weapon?.parts ?? []) }
  validateWarfareCatalog(catalog)
  return catalog
}

export const warfareSource = database.source
export const warfareCatalog = loadWarfareCatalog(database)
