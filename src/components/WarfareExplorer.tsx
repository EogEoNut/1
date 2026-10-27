import { useState } from 'react'
import { calculate, metadata, slotNames, specDefinitions, statKeys, statNames, weapons } from '../lib/warfare'
import type { Evidence, Part } from '../lib/warfare'
import { assessAttachmentChange, assessLoadout, removeAttachmentCascade } from '../lib/compatibility'
import { WarfareLoadoutPanel } from './WarfareLoadoutPanel'
import { WarfareRecommendation } from './WarfareRecommendation'

function SourceLink({ evidence }: { evidence: Evidence }) {
  if (!evidence.sourceUrl) return <span className="warfare-source">출처 미확인</span>
  return <a className="warfare-source" href={evidence.sourceUrl} target="_blank" rel="noreferrer">
    {evidence.sourceName} · 자료 확인 {evidence.observedAt ?? '미확인'} ↗
  </a>
}

function PartDetails({ part }: { part: Part }) {
  const known = statKeys.filter(key => part.deltas[key] !== undefined && part.deltas[key] !== null)
  return <div className="warfare-part-details">
    <p>{part.note}</p>
    <div className="warfare-deltas">{known.map(key => {
      const value = part.deltas[key]!
      return <span className={value > 0 ? 'positive' : value < 0 ? 'negative' : 'muted'} key={key}>{statNames[key]} {value > 0 ? '+' : ''}{value}</span>
    })}{!known.length && <span className="muted">수치 미확인 · 효과를 0으로 간주하지 않습니다.</span>}</div>
    <SourceLink evidence={part.evidence} />
    <small className="warfare-evidence">{part.evidence.status === 'verified' ? '게임 내 검증 완료' : part.evidence.status === 'observed' ? '외부 자료 관측 · 게임 내 미검증' : '자료 미확인'} · 정밀 보정 가능 여부 {part.tunable === null ? '미확인' : part.tunable ? '확인' : '지원 안 함'}</small>
  </div>
}

const calibrationLabels: Record<string, string> = {
  ads_movement_speed: '조준 이동 속도', extra_control: '추가 제어', moving_stability: '이동 중 안정성',
  ads_speed: '조준 속도', firing_stability: '사격 안정성', vertical_recoil: '수직 반동',
  horizontal_recoil: '수평 반동', hipfire_accuracy: '지향 사격 정밀도',
}

export function WarfareExplorer({ embedded = false, weaponName }: { embedded?: boolean; weaponName?: string }) {
  const [name, setName] = useState('M4A1')
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<Record<string, string>>({})
  const [source, setSource] = useState('전체')
  const [slotFilter, setSlotFilter] = useState('전체')
  const [partQuery, setPartQuery] = useState('')
  const [notice, setNotice] = useState('')
  const weapon = weapons.find(item => item.name === (weaponName ?? name)) ?? weapons[0]
  const stats = calculate(weapon, selection)
  const filteredWeapons = weapons.filter(item => item.name.toLowerCase().includes(query.toLowerCase().trim()))
  const supportedSlots = weapon.slots.map(slot => slot.id)
  const visibleParts = weapon.parts.filter(part =>
    (source === '전체' || part.evidence.sourceName === source)
    && (slotFilter === '전체' || part.slot === slotFilter)
    && `${part.name} ${slotNames[part.slot] ?? part.slot}`.toLowerCase().includes(partQuery.toLowerCase().trim()),
  )
  const slots = supportedSlots.filter(slot => visibleParts.some(part => part.slot === slot))
  const selectedCount = Object.keys(selection).length
  const compatibility = assessLoadout(weapon, selection)

  function choose(next: string) {
    setName(next)
    setSelection({})
    setSource('전체')
    setSlotFilter('전체')
    setPartQuery('')
    setNotice('')
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice('개조 코드 복사 완료 · 게임 적용 여부는 별도 확인이 필요합니다.') }
    catch { setNotice('이 환경에서는 자동 복사를 사용할 수 없습니다. 표시된 코드를 직접 선택해 복사하세요.') }
  }

  const Root = embedded ? 'section' : 'main'
  const Heading = embedded ? 'h3' : 'h1'
  return <Root id={embedded ? undefined : 'warfare-catalog'} className={`warfare-explorer ${embedded ? 'warfare-embedded' : ''}`} aria-label={embedded ? '전면전 총기 개조' : '전면전 총기 자료'}>
    <div className="warfare-head"><div><p className="eyebrow">WARFARE / SOURCE CATALOG</p><Heading>전면전 총기·부착물 자료</Heading></div><span className="sample-badge">사이트 관측 · 게임 내 미검증</span></div>
    <p className="warfare-warning">{metadata.season} · 자료 확인 {metadata.date}. DFTTK 편집기 관측 기록과 Aim Sector 공개 빌드 예시를 구분해 제공합니다. 전체 총기·부착물 데이터베이스가 아니며, 기록이 없다는 이유로 장착 불가를 뜻하지 않습니다.</p>
    {!embedded && <div className="warfare-coverage" aria-label="자료 수록 현황">
      <div><strong>{metadata.weaponCount}</strong><span>총기 이름 목록</span></div>
      <div><strong>{metadata.baseCount}</strong><span>기본 정보 수록 총기</span></div>
      <div><strong>{metadata.dfttkPartCount}</strong><span>DFTTK 부착물 기록</span></div>
      <div><strong>{metadata.observedWeaponCount}</strong><span>DFTTK 장착 목록 관측 총기</span></div>
    </div>}

    <div className="warfare-layout">{!embedded && <aside className="warfare-card">
      <label htmlFor="warfare-search">총기 검색 ({weapons.length}종)</label>
      <input id="warfare-search" value={query} placeholder="AKM, M4A1…" onChange={event => setQuery(event.target.value)} />
      <div className="warfare-weapon-list">{filteredWeapons.map(item => <button key={item.name} aria-pressed={item.name === weapon.name} className={item.name === weapon.name ? 'selected' : ''} onClick={() => choose(item.name)}>
        <span>{item.name}</span><small>{item.parts.length ? `부착물 ${item.parts.length}개` : item.base ? '일부 기본 정보' : '이름만 수록'}</small>
      </button>)}</div>
      {!filteredWeapons.length && <p className="warfare-note">검색 결과가 없습니다. <button className="text-button" onClick={() => setQuery('')}>검색 초기화</button></p>}
      <p className="warfare-note">전면전(Warfare) 자료만 수록합니다. 비콘 에어리어·폭파 모드의 수치로 대체하지 않습니다.</p>
    </aside>}

    <div className="warfare-card warfare-main">
      <div className="warfare-title"><div><p className="eyebrow">WEAPON RECORD</p><h2>{weapon.name}</h2><p className="warfare-note">분류: {weapon.category ?? '미확인'} · 게임 버전: {weapon.evidence.gameVersion ?? '미확인'}</p></div><span className="count-badge">{weapon.parts.length}개 관측 파츠</span></div>
      <section aria-label="총기 기본 정보"><h3>총기 기본 정보</h3>
        <dl className="warfare-specs">{specDefinitions.map(spec => <div key={spec.key}><dt>{spec.label}</dt><dd>{weapon.base?.[spec.key] ?? '미확인'} {weapon.base?.[spec.key] !== null && weapon.base?.[spec.key] !== undefined && <small>{spec.unit}</small>}</dd></div>)}</dl>
        {weapon.baseEvidence ? <SourceLink evidence={weapon.baseEvidence} /> : <p className="warfare-note">해당 총기의 기본 수치는 아직 수록하지 않았습니다.</p>}
      </section>

      <section aria-label="참고 능력치 합산"><h3>능력치 표시값 비교 <span className="count-badge">{selectedCount}개 선택</span></h3>
        <div className="warfare-stats" aria-live="polite">{statKeys.map(key => <div key={key} data-testid={`warfare-stat-${key}`}><span>{statNames[key]}</span><strong>{stats[key].final ?? '미확인'}</strong><small>기본 {stats[key].base ?? '미확인'} · 알려진 변화 {stats[key].knownDelta > 0 ? '+' : ''}{stats[key].knownDelta}</small><small>{stats[key].status === 'unknown' ? '계산 근거 부족' : '참고 합산 · 게임 공식 아님'}</small>{stats[key].unknownCount > 0 && <small className="warfare-unknown">효과 미확인 부품 {stats[key].unknownCount}개</small>}</div>)}</div>
        <p className="warfare-note">알려진 기본 표시값 + 알려진 부착물 변화량의 <strong>참고 합계</strong>입니다. 실제 게임 최종 능력치나 계산식으로 검증되지 않았습니다. 조준 시간·사거리 등 위의 기본 정보는 부착물을 선택해도 계산하지 않습니다. 정밀 보정·반동 배율은 계산에 포함하지 않습니다.</p>
        <p className="warfare-note">동시 장착: {compatibility.reason} 관측된 슬롯만 표시하며, 전체 슬롯과 기본 장착 부품은 미확인입니다.</p>
      </section>

      <WarfareLoadoutPanel weapon={weapon} selection={selection} stats={stats} onRemove={slot => setSelection(old => removeAttachmentCascade(weapon, old, slot))} />

      <section aria-label="부착물 목록"><div className="warfare-section-title"><h3>부착물 종류·정보</h3><button className="warfare-clear" disabled={!selectedCount} onClick={() => setSelection({})}>전체 파츠 해제</button></div>
        <div className="warfare-filters"><label>부착물 검색<input aria-label="부착물 이름 또는 종류 검색" placeholder="부착물 이름 또는 슬롯" value={partQuery} onChange={event => setPartQuery(event.target.value)} /></label><label>자료 출처<select aria-label="부착물 자료 출처" value={source} onChange={event => setSource(event.target.value)}>{['전체', 'DFTTK', 'Aim Sector'].map(value => <option key={value}>{value}</option>)}</select></label><label>슬롯 종류<select aria-label="부착물 슬롯 종류" value={slotFilter} onChange={event => setSlotFilter(event.target.value)}><option value="전체">전체</option>{supportedSlots.map(slot => <option key={slot} value={slot}>{slotNames[slot] ?? slot}</option>)}</select></label></div>
        <p className="warfare-note">{visibleParts.length} / {weapon.parts.length}개 표시 · 필터는 선택을 해제하지 않습니다. 이름은 출처 원문을 유지하며 공식 한국어 명칭으로 간주하지 않습니다.</p>
        {slots.map(slot => <section className="warfare-slot" key={slot} aria-label={`${slotNames[slot] ?? slot} 목록`}><div className="warfare-section-title"><h4>{slotNames[slot] ?? slot}</h4><button className="warfare-clear" disabled={!selection[slot]} onClick={() => setSelection(old => removeAttachmentCascade(weapon, old, slot))}>해당 슬롯 해제</button></div>
          {visibleParts.filter(part => part.slot === slot).map(part => {
            const assessment = assessAttachmentChange(weapon, selection, part)
            return <article className={`warfare-part ${selection[slot] === part.id ? 'is-selected' : ''}`} key={part.id}>
            <label className="warfare-part-choice"><input type="radio" name={`warfare-${slot}`} disabled={assessment.status !== 'allowed'} checked={selection[slot] === part.id} onChange={() => { if (assessment.status === 'allowed') setSelection(old => ({ ...old, [slot]: part.id })) }} /><span><strong>{part.name}</strong><small>{part.evidence.kind === 'site-listed' ? '해당 총기 편집기 목록에서 관측' : '공개 개조 예시에 등장'}</small></span></label>
            {assessment.status !== 'allowed' && <p className="warfare-compatibility-note">{assessment.status === 'unknown' ? '동시 장착 미확인' : '선택 제한'} · {assessment.reason}</p>}
            <PartDetails part={part} />
          </article>})}
        </section>)}
        {!visibleParts.length && <div className="warfare-empty">{weapon.parts.length ? '현재 필터에 맞는 부착물이 없습니다.' : '이 총기의 부착물 자료는 아직 수록하지 않았습니다. 장착 가능한 부품이 없다는 의미는 아닙니다.'}</div>}
      </section>

      {!!weapon.calibrations.length && <details className="warfare-reference"><summary>정밀 보정 참고 사례 {weapon.calibrations.length}건 · 계산에 미반영</summary><p className="warfare-note">출처의 특정 빌드 조정 사례이며 부착물의 기본 효과가 아닙니다. 위 합계에 더하지 않습니다.</p>{weapon.calibrations.map((entry, index) => <div key={index}><strong>{entry.attachment}</strong><span>{calibrationLabels[entry.stat] ?? entry.stat}: {entry.delta !== null && entry.delta > 0 ? '+' : ''}{entry.delta ?? '미확인'}{entry.unit}</span><a href={entry.sourceUrl} target="_blank" rel="noreferrer">출처 ↗</a></div>)}</details>}

      <details className="warfare-reference"><summary>전면전 개조 코드 {weapon.codes.length}개</summary><p className="warfare-note">기존 공개 빌드 자료의 코드입니다. 현재 선택에서 생성한 코드가 아니며, 게임 버전에 따른 적용·호환성은 별도 확인이 필요합니다.</p>{weapon.codes.map((entry, index) => <div className="warfare-code" key={index}><span>{entry.label}</span><code>{entry.code}</code><button onClick={() => void copy(entry.code)}>복사</button></div>)}{!weapon.codes.length && <p className="warfare-note">수록된 코드가 없습니다.</p>}</details>
      <p className="warfare-note" role="status">{notice}</p>
      <WarfareRecommendation weapon={weapon} />
    </div></div>
    <p className="warfare-note warfare-footer-note">자료 출처: <a href="https://dfttk.com/battlefield/builder" target="_blank" rel="noreferrer">DFTTK 전면전 편집기</a> · <a href="https://www.aimsector.com/news/delta-force-loadouts" target="_blank" rel="noreferrer">Aim Sector</a>. 수록 범위와 확인일은 위에 표시합니다. 자료 미확인과 게임 내 미검증을 구분해 확인하세요.</p>
  </Root>
}
