import { WarfareExplorer } from './components/WarfareExplorer'
import './components/warfare.css'
import { metadata as warfareMetadata } from './lib/warfare'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { AttachmentPicker } from './components/AttachmentPicker'
import { Icon } from './components/Icon'
import { StatsPanel } from './components/StatsPanel'
import { WeaponArt } from './components/WeaponArt'
import { WeaponList } from './components/WeaponList'
import { catalog, slotLabels } from './data/catalog'
import { calculateStats, compatibilityReason } from './lib/stats'
import type { Attachment, Loadout, SlotId } from './types'
import { filterWorkbenchWeapons, initialWorkbenchWeapon, workbenchCategories, workbenchWeapons } from './lib/workbench'
import type { DatasetFilter, WorkbenchEntry } from './lib/workbench'

export default function App() {
  const [view, setView] = useState<'workbench' | 'warfare'>('workbench')
  const [selected, setSelected] = useState<WorkbenchEntry>(initialWorkbenchWeapon)
  const [dataset, setDataset] = useState<DatasetFilter>('all')
  const [homeKey, setHomeKey] = useState(0)
  const [loadout, setLoadout] = useState<Loadout>({})
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [activeSlot, setActiveSlot] = useState<SlotId | null>(null)
  const [notice, setNotice] = useState('')
  const infoDialog = useRef<HTMLDialogElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const weapon = selected.kind === 'sample' ? selected.weapon : catalog.weapons[0]
  const sourceMode = view === 'warfare' || selected.kind === 'warfare'
  const current = calculateStats(weapon, loadout, catalog.attachments, catalog.statModel)
  const count = Object.keys(loadout).length
  const categories = workbenchCategories(dataset)
  const filtered = filterWorkbenchWeapons(dataset, search, category)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && !infoDialog.current?.open) {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('.search-box input, #warfare-search')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  function selectWeapon(next: WorkbenchEntry) {
    if (next.id === selected.id) return
    setSelected(next)
    setLoadout({})
    setActiveSlot(null)
    setNotice(next.kind === 'sample' ? `${next.name} 선택 · 샘플 기본 구성으로 전환했습니다.` : `${next.name} · 수록된 총기 자료를 불러왔습니다.`)
  }
  function chooseDataset(next: DatasetFilter) {
    setDataset(next)
    setSearch('')
    setCategory('전체')
    if (next !== 'all' && selected.kind !== next) selectWeapon(workbenchWeapons.find(entry => entry.kind === next)!)
  }
  function openSamples() {
    setView('workbench')
    chooseDataset('sample')
  }
  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    setView('workbench')
    setSelected(initialWorkbenchWeapon)
    setDataset('all')
    setSearch('')
    setCategory('전체')
    setLoadout({})
    setActiveSlot(null)
    setNotice('')
    setHomeKey(key => key + 1)
    infoDialog.current?.close()
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    requestAnimationFrame(() => {
      document.getElementById('home-title')?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
  }
  function selectPart(part?: Attachment) {
    if (!activeSlot) return
    if (part) {
      const reason = compatibilityReason(weapon, loadout, part, catalog.attachments)
      if (reason) { setNotice(reason); return }
    }
    setLoadout(previous => {
      const next = { ...previous }
      if (part) next[activeSlot] = part.id
      else delete next[activeSlot]
      return next
    })
    setNotice(part ? `${part.name} 장착 완료` : `${slotLabels[activeSlot]}를 기본 구성으로 변경했습니다.`)
  }
  function openSlot(slot: SlotId) {
    setActiveSlot(slot)
    window.setTimeout(() => pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  return <>
    <a className="skip-link" href={view === 'warfare' ? '#warfare-catalog' : '#workbench'}>개조 작업대로 이동</a>
    <header className="app-header">
      <a href={window.location.pathname + window.location.search} className="brand" aria-label="델타 랩 홈" onClick={goHome}><span className="brand-mark">Δ</span><span>DELTA<span className="brand-light">LAB</span><small>INDEPENDENT GUNSMITH WORKBENCH</small></span></a>
      <div className="header-divider" />
      <span className="header-page">총기 개조 시뮬레이터</span>
      <div className="header-right"><span className="version-chip"><i />MVP 0.1</span><button className="data-button" onClick={() => infoDialog.current?.showModal()}><Icon name="info" size={16} /><span>데이터 안내</span></button></div>
    </header>

    <nav aria-label="데이터 모드 선택" className="workspace-nav"><button aria-pressed={view === 'workbench' && dataset !== 'sample'} onClick={() => { setView('workbench'); chooseDataset('all') }}>개조 작업대</button><button aria-pressed={view === 'warfare'} onClick={() => setView('warfare')}>전면전 실제 자료 (부분 수집)</button><button aria-pressed={view === 'workbench' && dataset === 'sample'} onClick={openSamples}>가상 샘플 작업대</button></nav>
    {view==='warfare' ? <WarfareExplorer key={`catalog-${homeKey}`} /> : <>
    <main>
      <section className="page-intro"><div><p className="eyebrow"><span className="tiny-square" /> BUILD YOUR ADVANTAGE</p><h1 id="home-title" tabIndex={-1}>당신의 전투에 맞는 <span>한 자루.</span></h1><p className="intro-description">전면전 자료 {warfareMetadata.weaponCount}종과 가상 샘플 {catalog.weapons.length}종을 선택하고, 수록된 정보와 부착물을 확인하세요.</p></div><div className="intro-index"><span>WORKBENCH</span><strong>01 <span>/ 01</span></strong></div></section>

      {selected.kind === 'sample' ? <div className="sample-banner"><span className="sample-badge">SAMPLE DATA</span><p>선택한 총기·부착물·슬롯·수치는 <strong>가상 샘플</strong>입니다. 실제 델타포스 게임 성능을 나타내지 않습니다.</p><button onClick={() => infoDialog.current?.showModal()} aria-label="샘플 데이터 상세 안내"><Icon name="arrow" size={18} /></button></div> : <div className="sample-banner"><span className="sample-badge">SOURCE DATA</span><p><strong>전면전 관측 자료</strong> · 수치와 부착물은 확인된 범위만 표시합니다. 자료가 없는 항목은 미확인으로 표시하며, 샘플 수치로 채우지 않습니다.</p><button onClick={() => infoDialog.current?.showModal()} aria-label="전면전 자료 상세 안내"><Icon name="arrow" size={18} /></button></div>}

      <div className="workspace-grid">
        <WeaponList weapons={filtered} selected={selected} dataset={dataset} search={search} category={category} categories={categories} onSearch={setSearch} onCategory={setCategory} onSelect={selectWeapon} onDataset={chooseDataset} />

        {selected.kind === 'warfare' ? <section className="workbench panel source-workbench" id="workbench" aria-label="개조 작업대"><div className="panel-heading"><h2>개조 작업대</h2><span className="workbench-status"><i />전면전 관측 자료</span></div><WarfareExplorer key={`${homeKey}-${selected.id}`} embedded weaponName={selected.weapon.name} /></section> : <>

        <section className="workbench panel" id="workbench" aria-label="개조 작업대">
          <div className="panel-heading"><h2>개조 작업대</h2><span className="workbench-status"><i />{count ? 'CUSTOM BUILD' : 'BASE CONFIGURATION'}</span></div>
          <div className="weapon-stage">
            <div className="stage-top"><div><span className="eyebrow">{weapon.subtitle}</span><h2>{weapon.name}</h2><p>{weapon.description}</p></div><span className="sample-tag">샘플 총기</span></div>
            <div className="schematic"><div className="schematic-cross top-left" /><div className="schematic-cross bottom-right" /><span className="schematic-label">PLATFORM / {weapon.id.toUpperCase()}</span><WeaponArt variant={weapon.silhouette} hasOptic={!!loadout.optic} /><span className="illustration-note">독자 제작 가상 도식 · 부품 외형 미반영</span></div>
            <div className="stage-bottom"><span className="micro">{weapon.category} <span className="muted">/</span> MODULAR PLATFORM</span><div className="stage-progress">{weapon.slots.map(slot => <i key={slot} className={loadout[slot] ? 'filled' : ''} />)}<span>{count}<span className="muted"> / {weapon.slots.length}</span></span></div></div>
          </div>

          <div className="slot-section"><div className="section-heading"><div><h3>부착물 구성 <span className="count-badge">{count} 장착</span></h3><p>슬롯을 선택해 부착물을 장착하세요.</p></div><button className="reset-button" disabled={count === 0} onClick={() => { setLoadout({}); setNotice('모든 부착물을 해제했습니다.') }}><Icon name="reset" size={15} />전체 초기화</button></div>
            <div className="slot-grid">{weapon.slots.map(slot => {
              const part = catalog.attachments.find(item => item.id === loadout[slot])
              return <button key={slot} data-slot={slot} aria-expanded={activeSlot === slot} aria-controls="attachment-picker" className={`slot-card ${activeSlot === slot ? 'active' : ''} ${part ? 'has-part' : ''}`} onClick={() => openSlot(slot)}><span className="slot-card-label">{slotLabels[slot]}<Icon name={part ? 'check' : 'plus'} size={14} /></span><Icon name={slot} size={27} /><strong>{part?.name ?? '기본 구성'}</strong><span className="slot-hint">{part ? '장착됨 · 변경하기' : '부착물 선택'}</span></button>
            })}</div>
          </div>

          <div ref={pickerRef} id="attachment-picker">{activeSlot ? <AttachmentPicker weapon={weapon} loadout={loadout} slot={activeSlot} onChange={selectPart} onClose={() => { const slot = activeSlot; setActiveSlot(null); document.querySelector<HTMLButtonElement>(`[data-slot="${slot}"]`)?.focus() }} /> : <div className="workbench-tip"><div className="tip-symbol"><Icon name="target" size={22} /></div><div><strong>작은 변화가 다른 플레이를 만듭니다.</strong><p>부착물을 장착하고 오른쪽에서 성능 변화를 확인하세요.</p></div><span className="mono">TRY IT <Icon name="arrow" size={15} /></span></div>}</div>
          <div className="session-note"><span className="tiny-square" />현재 세션에서 체험하는 MVP입니다. 새로고침하면 개조가 초기화됩니다.</div>
        </section>

        <StatsPanel weapon={weapon} loadout={loadout} current={current} />
        </>}
      </div>

      <section className="roadmap"><div><span className="eyebrow">THE NEXT CHAPTER</span><h2>나만의 세팅에서, 나에게 맞는 추천까지.</h2></div><div className="roadmap-steps"><span><i className="live-dot" />개조 시뮬레이션 <b>현재</b></span><span>02 <strong>빌드 저장·비교</strong></span><span>03 <strong>플레이 스타일 추천</strong></span></div></section>
    </main>
    </>}

    <footer><span><strong>DELTA LAB</strong> <span className="muted">/</span> 비공식 팬 프로젝트</span><p>Delta Force와 공식적인 제휴 관계가 없습니다.</p><span className="mono">{sourceMode ? `SOURCE RECORDS · ${warfareMetadata.date}` : 'SAMPLE DATASET · v1.0'}</span></footer>
    <div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite">{notice && <><Icon name="check" size={16} />{notice}</>}</div>

    <dialog ref={infoDialog} aria-labelledby="data-dialog-title" className="data-dialog" onClick={event => { if (event.target === event.currentTarget) infoDialog.current?.close() }}>
      <div className="dialog-heading"><span className="eyebrow">DATA TRANSPARENCY</span><button className="icon-button" aria-label="데이터 안내 닫기" onClick={() => infoDialog.current?.close()}><Icon name="close" /></button></div><h2 id="data-dialog-title">{sourceMode ? '전면전 자료 안내' : '샘플 데이터 안내'}</h2>
      {sourceMode ? <><p>수록된 총기 이름은 {warfareMetadata.weaponCount}종이지만 기본 제원이 있는 총기는 {warfareMetadata.baseCount}종입니다. 부착물은 총기별 수록 범위가 다릅니다. 게임 내 미검증 자료이며, 가상 샘플과 별도로 계산합니다.</p><dl><div><dt>자료 확인일</dt><dd>{warfareMetadata.date} · {warfareMetadata.season}</dd></div><div><dt>출처</dt><dd>DFTTK 전면전 편집기 · Aim Sector 공개 빌드</dd></div><div><dt>수치 미확인</dt><dd>0이나 샘플 수치로 대체하지 않습니다. 이름만 있는 총기도 목록에서 선택할 수 있습니다.</dd></div><div><dt>계산과 호환성</dt><dd>알려진 변화량의 참고 합계입니다. 관측된 부품·조합만 선택하며 실제 게임 최종 성능이나 전체 호환성을 보장하지 않습니다.</dd></div></dl></> : <><p>{catalog.notice}</p>
      <dl><div><dt>데이터 버전</dt><dd>{catalog.version}</dd></div><div><dt>출처</dt><dd>기능 검증을 위해 자체 제작한 가상 데이터</dd></div><div><dt>게임 내 검증일</dt><dd>미검증 · 실제 게임 버전 미지정</dd></div><div><dt>계산 모델</dt><dd>{catalog.statModel.description}</dd></div><div><dt>호환성</dt><dd>컴팩트 총열과 롱 소음기 제한 등 모든 규칙은 샘플입니다. 실제 슬롯 구조나 개조 코드 호환을 보장하지 않습니다.</dd></div></dl><p className="dialog-note">검증된 게임 자료는 출처·확인일·게임 버전과 함께 별도 데이터셋으로 추가할 예정입니다.</p></>}
      <button className="primary-button" onClick={() => infoDialog.current?.close()}>확인하고 체험하기<Icon name="arrow" /></button>
    </dialog>
  </>
}
