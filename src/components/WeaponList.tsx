import type { Weapon } from '../types'
import { Icon } from './Icon'
import { WeaponArt } from './WeaponArt'

interface Props {
  weapons: Weapon[]
  selected: Weapon
  search: string
  category: string
  categories: string[]
  onSearch: (value: string) => void
  onCategory: (value: string) => void
  onSelect: (weapon: Weapon) => void
}
export function WeaponList({ weapons, selected, search, category, categories, onSearch, onCategory, onSelect }: Props) {
  return <aside className="weapon-panel panel" aria-label="총기 선택">
    <div className="panel-heading"><h2>총기 선택</h2><span className="mono muted">{String(weapons.length).padStart(2, '0')} PLATFORMS</span></div>
    <label className="search-box"><Icon name="search" /><input aria-label="총기 이름 또는 종류 검색" value={search} onChange={e => onSearch(e.target.value)} placeholder="이름 또는 종류 검색" /><kbd>/</kbd></label>
    <div className="category-list" aria-label="총기 종류 필터">{['전체', ...categories].map(item => <button key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => onCategory(item)}>{item}</button>)}</div>
    <div className="weapon-list">
      {weapons.map((weapon, index) => <button key={weapon.id} aria-pressed={selected.id === weapon.id} className={`weapon-card ${selected.id === weapon.id ? 'selected' : ''}`} onClick={() => onSelect(weapon)}>
        <div className="weapon-card-top"><span className="micro">{weapon.category}</span><span className="mono">0{index + 1}</span></div>
        <WeaponArt variant={weapon.silhouette} compact />
        <div className="weapon-card-bottom"><div><strong>{weapon.name}</strong><span className="micro">{weapon.subtitle.split(' / ')[0]}</span></div><span className="selection-dot">{selected.id === weapon.id && <Icon name="check" size={12} />}</span></div>
      </button>)}
      {weapons.length === 0 && <div className="empty-state"><Icon name="search" size={26} /><strong>검색 결과가 없습니다</strong><p>다른 이름이나 종류를 입력해 보세요.</p><button className="text-button" onClick={() => { onSearch(''); onCategory('전체') }}>필터 초기화</button></div>}
    </div>
    <div className="library-note"><Icon name="info" size={16} /><p>가상 총기 3종으로 기능을 체험하세요.<br />실제 게임 데이터는 추후 추가됩니다.</p></div>
  </aside>
}
