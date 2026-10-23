import { useState } from 'react'
import { calculate,metadata,slotNames,statKeys,statNames,weapons } from '../lib/warfare'
export function WarfareExplorer(){
 const [name,setName]=useState('AKM')
 const [query,setQuery]=useState('')
 const [selection,setSelection]=useState<Record<string,string>>({})
 const [notice,setNotice]=useState('')
 const weapon=weapons.find(w=>w.name===name)??weapons[0]
 const stats=calculate(weapon,selection)
 const slots=Array.from(new Set(weapon.parts.map(part=>part.slot)))
 function choose(next:string){setName(next);setSelection({});setNotice('')}
 async function copy(value:string){try{await navigator.clipboard.writeText(value);setNotice('개조 코드 복사 완료')}catch{setNotice('복사할 수 없어. 코드를 직접 선택해 줘.')}}
 return <section className="warfare-explorer" aria-label="전면전 총기 자료">
 <div className="warfare-head"><div><p className="eyebrow">WARFARE DATA / {metadata.season}</p><h2>전면전 총기 자료</h2></div><span className="sample-badge">부분 수집 · 게임 내 미검증</span></div>
 <p className="warfare-warning">비콘 에어리어 및 폭파 모드 제외 · {metadata.date} 기준 · 66종 총기 목록과 일부 파츠 관측만 수록. 실제 게임의 전체 파츠 목록이나 계산식은 아직 확인되지 않았어.</p>
 <div className="warfare-layout"><aside className="warfare-card"><label htmlFor="warfare-search">총기 검색 ({weapons.length}종)</label><input id="warfare-search" value={query} placeholder="AKM, M4A1…" onChange={e=>setQuery(e.target.value)}/>
 <div className="warfare-weapon-list">{weapons.filter(w=>w.name.toLowerCase().includes(query.toLowerCase())).map(w=><button key={w.name} aria-pressed={w.name===weapon.name} className={w.name===weapon.name?'selected':''} onClick={()=>choose(w.name)}>{w.name}<small>{w.base?'일부 스펙 확인':'스펙 미확인'}</small></button>)}</div></aside>
 <div className="warfare-card warfare-main"><h3>{weapon.name}</h3><p>확인된 파츠 기록 {weapon.parts.length}개 · 슬롯별 선택 가능 · 수치 미확인은 미확인으로 표시</p>
 <div className="warfare-stats">{statKeys.map(k=><div key={k}><span>{statNames[k]}</span><strong>{stats[k].final??'미확인'}</strong><small>기본 {stats[k].base??'미확인'} · 알려진 보정 {stats[k].knownDelta>0?'+':''}{stats[k].knownDelta}</small></div>)}</div>
 <p className="warfare-note">파츠 수치가 모두 확인된 기본 능력치만 합산해. ADS, 정밀 보정, 실제 반동 배율, 특수 조합 효과는 계산하지 않아.</p>
 <h4>전면전 개조 코드 ({weapon.codes.length})</h4>{weapon.codes.map((entry,i)=><div className="warfare-code" key={i}><span>{entry.label}</span><code>{entry.code}</code><button onClick={()=>void copy(entry.code)}>복사</button></div>)}{weapon.codes.length===0&&<p>확인된 개조 코드가 없어.</p>}
 <h4>관측 파츠 ({weapon.parts.length})</h4>{slots.map(slot=><div className="warfare-slot" key={slot}><h5>{slotNames[slot]??slot}</h5>{weapon.parts.filter(part=>part.slot===slot).map(part=><label className="warfare-part" key={part.id}>
 <input type="radio" name={'warfare-'+slot} checked={selection[slot]===part.id} onChange={()=>setSelection(old=>({...old,[slot]:part.id}))}/>
 <span><strong>{part.name}</strong><small>{part.source} · {part.note}</small><em>{statKeys.filter(k=>part.deltas[k]!==undefined&&part.deltas[k]!==null).map(k=>statNames[k]+' '+(part.deltas[k]!>0?'+':'')+part.deltas[k]).join(' / ')||'세부 수치 미확인'}</em></span></label>)}
 <button className="warfare-clear" disabled={!selection[slot]} onClick={()=>setSelection(old=>{const next={...old};delete next[slot];return next})}>해당 슬롯 해제</button></div>)}{slots.length===0&&<p>해당 총기에서 확인된 호환 파츠가 없어. 장착할 수 없다는 뜻은 아니야.</p>}
 {Object.keys(selection).length>0&&<button className="warfare-clear" onClick={()=>setSelection({})}>전체 파츠 해제</button>}
 <p role="status">{notice}</p></div></div><p className="warfare-note">출처: <a href="https://dfttk.com/battlefield/builder" target="_blank" rel="noreferrer">DFTTK</a> · <a href="https://www.aimsector.com/news/delta-force-loadouts" target="_blank" rel="noreferrer">Aim Sector</a>. 9개 DFTTK 후방 손잡이는 M4A1 편집 화면의 관측, AKM 16개 파츠는 공개 빌드의 등장 기록이야.</p></section>
}
