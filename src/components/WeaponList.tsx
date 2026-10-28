import type { DatasetFilter, WorkbenchEntry } from '../lib/workbench'
import { workbenchWeapons } from '../lib/workbench'
import { Icon } from './Icon'
import { WeaponArt } from './WeaponArt'

interface Props {
  weapons: WorkbenchEntry[]
  selected: WorkbenchEntry
  dataset: DatasetFilter
  search: string
  category: string
  categories: string[]
  onSearch: (value: string) => void
  onCategory: (value: string) => void
  onSelect: (weapon: WorkbenchEntry) => void
  onDataset: (dataset: DatasetFilter) => void
}
export function WeaponList({ weapons, selected, dataset, search, category, categories, onSearch, onCategory, onSelect, onDataset }: Props) {
  return <aside className="weapon-panel panel" aria-label="총기 선택">
    <div className="panel-heading"><h2>총기 선택</h2><span className="mono muted">{String(weapons.length).padStart(2, '0')} PLATFORMS</span></div>
    <div className="dataset-filters" aria-label="총기 자료 종류">{([
      ['all', '전체'], ['warfare', '전면전'], ['sample', '샘플'],
    ] as const).map(([value, label]) => <button key={value} className={dataset === value ? 'active' : ''} aria-pressed={dataset === value} onClick={() => onDataset(value)}>{label} ({value === 'all' ? workbenchWeapons.length : workbenchWeapons.filter(entry => entry.kind === value).length})</button>)}</div>
    <label className="search-box"><Icon name="search" /><input aria-label="총기 이름 또는 종류 검색" value={search} onChange={e => onSearch(e.target.value)} placeholder="이름 또는 종류 검색" /><kbd>/</kbd></label>
    <div className="category-list" aria-label="총기 종류 필터">{['전체', ...categories].map(item => <button key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => onCategory(item)}>{item}</button>)}</div>
    <div className="weapon-list">
      {weapons.map(weapon => <button key={weapon.id} aria-pressed={selected.id === weapon.id} className={`weapon-card ${weapon.kind === 'warfare' ? 'source-weapon-card' : ''} ${selected.id === weapon.id ? 'selected' : ''}`} onClick={() => onSelect(weapon)}>
        <div className="weapon-card-top"><span className="micro">{weapon.category}</span><span className="weapon-data-tag">{weapon.kind === 'sample' ? '샘플' : '관측 자료'}</span></div>
        {weapon.kind === 'sample' && <WeaponArt variant={weapon.weapon.silhouette} compact />}
        <div className="weapon-card-bottom"><div><strong>{weapon.name}</strong><span className="micro">{weapon.kind === 'sample' ? weapon.weapon.subtitle.split(' / ')[0] : weapon.weapon.parts.length ? `관측 부품 ${weapon.weapon.parts.length}개` : weapon.weapon.base ? '일부 기본 정보 수록' : '이름 수록 · 제원 미확인'}</span></div><span className="selection-dot">{selected.id === weapon.id && <Icon name="check" size={12} />}</span></div>
      </button>)}
      {weapons.length === 0 && <div className="empty-state"><Icon name="search" size={26} /><strong>{dataset === 'warfare' && !workbenchWeapons.some(entry => entry.kind === 'warfare') ? '전면전 총기 자료 미등록' : '검색 결과가 없습니다'}</strong><p>자료가 등록되면 검색·종류 필터로 선택할 수 있습니다.</p><button className="text-button" onClick={() => { onSearch(''); onCategory('전체') }}>필터 초기화</button></div>}
    </div>
    <div className="library-note"><Icon name="info" size={16} /><p>전면전 자료 {workbenchWeapons.filter(entry => entry.kind === 'warfare').length}종 · 가상 샘플 {workbenchWeapons.filter(entry => entry.kind === 'sample').length}종<br />자료와 샘플의 계산·출처는 구분됩니다.</p></div>
  </aside>
}
