import { catalog, slotLabels, statLabels } from '../data/catalog'
import { compatibilityReason } from '../lib/stats'
import { statKeys, type Attachment, type Loadout, type SlotId, type Weapon } from '../types'
import { Icon } from './Icon'

export function ModifierList({ part }: { part: Attachment }) {
  return <div className="modifier-list">{statKeys.filter(key => part.modifiers[key]).map(key => <span className={(part.modifiers[key] ?? 0) > 0 ? 'positive' : 'negative'} key={key}>{statLabels[key]} <b>{(part.modifiers[key] ?? 0) > 0 ? '+' : ''}{part.modifiers[key]}</b></span>)}</div>
}

export function AttachmentPicker({ weapon, loadout, slot, onChange, onClose }: { weapon: Weapon; loadout: Loadout; slot: SlotId; onChange: (part?: Attachment) => void; onClose: () => void }) {
  const parts = catalog.attachments.filter(part => part.slot === slot && part.weaponIds.includes(weapon.id))
  return <section className="attachment-picker" aria-label={`${slotLabels[slot]} 부착물 선택`}>
    <div className="picker-heading"><div><span className="eyebrow">CONFIGURE ATTACHMENT</span><h3>{slotLabels[slot]} 선택 <span className="count-badge">{parts.length}</span></h3></div><button className="icon-button" aria-label="부착물 선택 닫기" onClick={onClose}><Icon name="close" /></button></div>
    <div className="part-list">
      <button className={`part-option stock-option ${!loadout[slot] ? 'equipped' : ''}`} aria-pressed={!loadout[slot]} onClick={() => onChange()}><div className="part-symbol"><Icon name={slot} size={26} /></div><div><strong>기본 구성</strong><p>추가 부착물 없이 기본 상태를 유지합니다.</p></div><span className="part-action">{!loadout[slot] ? <Icon name="check" /> : '해제'}</span></button>
      {parts.map(part => {
        const reason = compatibilityReason(weapon, loadout, part, catalog.attachments)
        const selected = loadout[slot] === part.id
        return <button key={part.id} className={`part-option ${selected ? 'equipped' : ''}`} disabled={!!reason} aria-pressed={selected} onClick={() => onChange(part)}>
          <div className="part-symbol"><Icon name={slot} size={26} /></div><div className="part-copy"><strong>{part.name}</strong><p>{part.description}</p><ModifierList part={part} />{reason && <span className="incompatibility">{reason}</span>}</div><span className="part-action">{selected ? <Icon name="check" /> : <Icon name="plus" />}</span>
        </button>
      })}
    </div>
    <p className="picker-note"><Icon name="info" size={13} />호환 규칙과 효과는 샘플용으로 제작되었습니다.</p>
  </section>
}
