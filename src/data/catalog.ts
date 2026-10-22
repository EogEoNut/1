import raw from './sample.json'
import type { Catalog, SlotId, StatKey } from '../types'

export const catalog: Catalog = raw as Catalog
export const statLabels: Record<StatKey, string> = {
  control: '반동 제어', handling: '조작 속도', stability: '사격 안정성', mobility: '기동성', range: '유효 거리',
}
export const slotLabels: Record<SlotId, string> = {
  barrel: '총열', muzzle: '총구', foregrip: '전방 손잡이', stock: '개머리판', magazine: '탄창', optic: '조준경',
}
