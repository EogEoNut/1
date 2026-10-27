import seed from '../data/warfare_seed.json'
import grips from '../data/dfttk_grips.json'

export const statKeys = ['control', 'handling', 'stability', 'accuracy'] as const
export type Stat = typeof statKeys[number]
export const statNames: Record<Stat, string> = {control:'반동 제어',handling:'조작 속도',stability:'안정성',accuracy:'지향 정밀도'}
export const slotNames: Record<string,string> = {rear_grip:'후방 손잡이',foregrip:'전방 손잡이',barrel:'총열',muzzle:'총구',stock:'개머리판',magazine:'탄창',mag_mount:'탄창 보조',right_rail:'우측 레일',left_patch:'좌측 패널',right_patch:'우측 패널',upper_rail:'상단 레일',charging_handle:'장전 손잡이',tactical_device:'전술 장비'}
export interface Evidence {sourceUrl:string; observedAt:string; sourceName:'DFTTK'|'Aim Sector'; kind:'site-listed'|'published-build'|'site-base'; gameVerified:false}
export interface Part {id:string; name:string; slot:string; deltas:Partial<Record<Stat,number|null>>; source:string; note:string; evidence:Evidence}
export interface Calibration {attachment:string; stat:string; unit:string; delta:number|null; sourceUrl:string}
export interface Weapon {name:string; base: Record<string,number|null>|null; baseEvidence:Evidence|null; codes: {code:string; label:string}[]; parts: Part[]; calibrations:Calibration[]}
export const specDefinitions = [
 {key:'damage',label:'자료 표시 피해량',unit:''},
 {key:'range_m',label:'자료 표시 사거리',unit:'m'},
 {key:'rpm',label:'발사 속도',unit:'발/분'},
 {key:'capacity',label:'기본 장탄수',unit:'발'},
 {key:'ads_ms',label:'조준 전환 시간',unit:'ms'},
 {key:'sprint_to_fire_ms',label:'질주 후 사격 전환',unit:'ms'},
 {key:'ads_move_mps',label:'조준 이동 속도',unit:'m/s'},
] as const
const numeric = (value:unknown):number|null => {
 if(typeof value!=='number'&&typeof value!=='string')return null
 if(typeof value==='string'&&!value.trim())return null
 const parsed=Number(value)
 return Number.isFinite(parsed)?parsed:null
}
const bases = new Map(seed.verified_weapon_base_partial.filter(row=>row.mode==='Warfare').map(row=>[row.weapon,row]))
const parts = new Map<string,Part>()
const byWeapon = new Map<string,Set<string>>()
for(const p of grips.attachments) {
 if(p.mode!=='Warfare')continue
 const deltas = Object.fromEntries(statKeys.map(key=>[key,numeric(p.displayed_deltas[key])])) as Part['deltas']
 parts.set(p.id,{id:p.id,name:p.name_cn,slot:p.slot,deltas,source:'DFTTK 전면전 편집기',note:'해당 총기 편집기의 슬롯 목록에서 관측 · 게임 내 미검증',evidence:{sourceUrl:p.provenance.source,observedAt:p.provenance.observed_at,sourceName:'DFTTK',kind:'site-listed',gameVerified:false}})
}
for(const row of grips.weapon_attachment_observations) {
 if(!parts.has(row.attachment_id)||parts.get(row.attachment_id)!.slot!==row.slot)continue
 if(!byWeapon.has(row.weapon))byWeapon.set(row.weapon,new Set())
 byWeapon.get(row.weapon)!.add(row.attachment_id)
}
for(const [index,p] of seed.confirmed_akm_attachment_examples.filter(row=>row.mode==='Warfare').entries()){
 const id='akm:'+index
 parts.set(id,{id,name:p.attachment,slot:p.slot,deltas:{},source:'Aim Sector 전면전 예시',note:p.effect_description,evidence:{sourceUrl:p.source_url,observedAt:seed.manifest.as_of,sourceName:'Aim Sector',kind:'published-build',gameVerified:false}})
 if(!byWeapon.has('AKM'))byWeapon.set('AKM',new Set())
 byWeapon.get('AKM')!.add(id)
}
export const weapons:Weapon[]=seed.weapons.map(name=>{
 const base=bases.get(name)
 return {
  name,
  base:base?Object.fromEntries([...statKeys,...specDefinitions.map(spec=>spec.key)].map(key=>[key,numeric(base[key as keyof typeof base])])):null,
  baseEvidence:base?{sourceUrl:base.source_url,observedAt:base.observed_at,sourceName:base.source_url.includes('dfttk.com')?'DFTTK':'Aim Sector',kind:'site-base',gameVerified:false}:null,
  codes:seed.loadouts.filter(row=>row.mode==='Warfare'&&row.weapon===name).map(row=>({code:row.loadout_code,label:row.build_label})),
  parts:[...(byWeapon.get(name)??[])].map(id=>parts.get(id)!).filter(Boolean),
  calibrations:seed.akm_tuned_calibration_examples.filter(row=>row.mode==='Warfare'&&row.weapon===name).map(row=>({attachment:row.attachment,stat:row.stat,unit:row.unit,delta:numeric(row.delta),sourceUrl:row.source_url})),
 }
})
/** Known bar deltas are a reference sum, not a verified game calculation. */
export function calculate(weapon:Weapon,selection:Record<string,string>) {
 const chosen=Object.entries(selection).map(([slot,id])=>{
  const part=weapon.parts.find(part=>part.id===id)
  if(part&&part.slot!==slot)throw Error('부착물 슬롯이 일치하지 않습니다')
  return part
 })
 if(chosen.some(part=>!part))throw Error('해당 총기의 관측 파츠가 아닙니다')
 if(new Set(chosen.map(part=>part!.slot)).size!==chosen.length)throw Error('동일 슬롯 중복')
 return Object.fromEntries(statKeys.map(key=>{
  const base=weapon.base?.[key]??null
  const unknownCount=chosen.filter(part=>part!.deltas[key]===undefined||part!.deltas[key]===null).length
  const knownDelta=chosen.reduce((n,part)=>n+(part!.deltas[key]??0),0)
  return [key,{base,knownDelta,unknownCount,final:base!==null&&unknownCount===0?base+knownDelta:null}]
 })) as Record<Stat,{base:number|null;knownDelta:number;unknownCount:number;final:number|null}>
}
export const metadata = {
 mode:'Warfare',date:seed.manifest.as_of,season:seed.manifest.season,complete:false,
 weaponCount:weapons.length,baseCount:weapons.filter(w=>w.base).length,
 dfttkPartCount:grips.attachments.filter(part=>part.mode==='Warfare').length,
 observedWeaponCount:weapons.filter(w=>w.parts.some(part=>part.evidence.sourceName==='DFTTK')).length,
}
