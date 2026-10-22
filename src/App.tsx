import { useEffect, useRef, useState } from 'react'
import { AttachmentPicker } from './components/AttachmentPicker'
import { Icon } from './components/Icon'
import { StatsPanel } from './components/StatsPanel'
import { WeaponArt } from './components/WeaponArt'
import { WeaponList } from './components/WeaponList'
import { catalog, slotLabels } from './data/catalog'
import { calculateStats, compatibilityReason } from './lib/stats'
import type { Attachment, Loadout, SlotId, Weapon } from './types'

export default function App() {
  const [weapon, setWeapon] = useState(catalog.weapons[0])
  const [loadout, setLoadout] = useState<Loadout>({})
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [activeSlot, setActiveSlot] = useState<SlotId | null>(null)
  const [notice, setNotice] = useState('')
  const infoDialog = useRef<HTMLDialogElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const current = calculateStats(weapon, loadout, catalog.attachments, catalog.statModel)
  const count = Object.keys(loadout).length
  const categories = [...new Set(catalog.weapons.map(item => item.category))]
  const filtered = catalog.weapons.filter(item => (category === '전체' || item.category === category) && `${item.name} ${item.subtitle} ${item.category}`.toLowerCase().includes(search.toLowerCase().trim()))

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && !infoDialog.current?.open) {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('.search-box input')?.focus()
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

  function selectWeapon(next: Weapon) {
    if (next.id === weapon.id) return
    setWeapon(next)
    setLoadout({})
    setActiveSlot(null)
    setNotice(`${next.name} 선택 · 기본 구성으로 전환했습니다.`)
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
    <a className="skip-link" href="#workbench">개조 작업대로 이동</a>
    <header className="app-header">
      <a href="#root" className="brand" aria-label="델타 랩 홈"><span className="brand-mark">Δ</span><span>DELTA<span className="brand-light">LAB</span><small>INDEPENDENT GUNSMITH WORKBENCH</small></span></a>
      <div className="header-divider" />
      <span className="header-page">총기 개조 시뮬레이터</span>
      <div className="header-right"><span className="version-chip"><i />MVP 0.1</span><button className="data-button" onClick={() => infoDialog.current?.showModal()}><Icon name="info" size={16} /><span>데이터 안내</span></button></div>
    </header>

    <main>
      <section className="page-intro"><div><p className="eyebrow"><span className="tiny-square" /> BUILD YOUR ADVANTAGE</p><h1>당신의 전투에 맞는 <span>한 자루.</span></h1><p className="intro-description">선택하고, 조합하고, 비교하세요. 나만의 세팅이 시작되는 곳.</p></div><div className="intro-index"><span>WORKBENCH</span><strong>01 <span>/ 01</span></strong></div></section>

      <div className="sample-banner"><span className="sample-badge">SAMPLE DATA</span><p>현재 모든 총기·부착물·슬롯·수치는 <strong>가상 샘플</strong>입니다. 실제 델타포스 게임 성능을 나타내지 않습니다.</p><button onClick={() => infoDialog.current?.showModal()} aria-label="샘플 데이터 상세 안내"><Icon name="arrow" size={18} /></button></div>

      <div className="workspace-grid">
        <WeaponList weapons={filtered} selected={weapon} search={search} category={category} categories={categories} onSearch={setSearch} onCategory={setCategory} onSelect={selectWeapon} />

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
      </div>

      <section className="roadmap"><div><span className="eyebrow">THE NEXT CHAPTER</span><h2>나만의 세팅에서, 나에게 맞는 추천까지.</h2></div><div className="roadmap-steps"><span><i className="live-dot" />개조 시뮬레이션 <b>현재</b></span><span>02 <strong>빌드 저장·비교</strong></span><span>03 <strong>플레이 스타일 추천</strong></span></div></section>
    </main>

    <footer><span><strong>DELTA LAB</strong> <span className="muted">/</span> 비공식 팬 프로젝트</span><p>Delta Force와 공식적인 제휴 관계가 없습니다.</p><span className="mono">SAMPLE DATASET · v1.0</span></footer>
    <div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite">{notice && <><Icon name="check" size={16} />{notice}</>}</div>

    <dialog ref={infoDialog} aria-labelledby="data-dialog-title" className="data-dialog" onClick={event => { if (event.target === event.currentTarget) infoDialog.current?.close() }}>
      <div className="dialog-heading"><span className="eyebrow">DATA TRANSPARENCY</span><button className="icon-button" aria-label="데이터 안내 닫기" onClick={() => infoDialog.current?.close()}><Icon name="close" /></button></div><h2 id="data-dialog-title">샘플 데이터 안내</h2><p>{catalog.notice}</p>
      <dl><div><dt>데이터 버전</dt><dd>{catalog.version}</dd></div><div><dt>출처</dt><dd>기능 검증을 위해 자체 제작한 가상 데이터</dd></div><div><dt>게임 내 검증일</dt><dd>미검증 · 실제 게임 버전 미지정</dd></div><div><dt>계산 모델</dt><dd>{catalog.statModel.description}</dd></div><div><dt>호환성</dt><dd>컴팩트 총열과 롱 소음기 제한 등 모든 규칙은 샘플입니다. 실제 슬롯 구조나 개조 코드 호환을 보장하지 않습니다.</dd></div></dl><p className="dialog-note">검증된 게임 자료는 출처·확인일·게임 버전과 함께 별도 데이터셋으로 추가할 예정입니다.</p><button className="primary-button" onClick={() => infoDialog.current?.close()}>확인하고 체험하기<Icon name="arrow" /></button>
    </dialog>
  </>
}
