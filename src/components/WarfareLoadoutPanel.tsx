import { slotNames, statKeys, statNames } from '../lib/warfare'
import type { WarfareLoadout, WarfareStat, WarfareStatResult, WarfareWeapon } from '../types/warfare'

export function WarfareLoadoutPanel({ weapon, selection, stats, onRemove }: {
  weapon: WarfareWeapon
  selection: WarfareLoadout
  stats: Record<WarfareStat, WarfareStatResult>
  onRemove: (slot: string) => void
}) {
  const selected = Object.values(selection).map(id => weapon.parts.find(part => part.id === id)!)
  return <section className="warfare-selected" aria-label="선택 부착물과 기여도">
    <h3>선택 부착물 · 표시값 기여도</h3>
    {!selected.length && <p className="warfare-note">선택한 부착물이 없습니다. 기본 장착 부품의 구성은 아직 확인되지 않았습니다.</p>}
    <ul>{selected.map(part => <li key={part.id}>
      <div className="warfare-section-title"><div><small>{slotNames[part.slot] ?? part.slot}</small><strong>{part.name}</strong></div><button className="warfare-clear" aria-label={`${part.name} 선택 해제`} onClick={() => onRemove(part.slot)}>해제</button></div>
      <div className="warfare-deltas">{statKeys.map(key => {
        const value = stats[key].contributions.find(item => item.attachmentId === part.id)?.amount ?? null
        return <span key={key} className={value === null ? 'muted' : value > 0 ? 'positive' : value < 0 ? 'negative' : 'muted'}>{statNames[key]} {value === null ? '미확인' : `${value > 0 ? '+' : ''}${value}`}</span>
      })}</div>
    </li>)}</ul>
  </section>
}
