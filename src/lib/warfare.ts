import seed from '../data/warfare_seed.json'
import grips from '../data/dfttk_grips.json'

export const statKeys = ['control', 'handling', 'stability', 'accuracy'] as const
export type Stat = typeof statKeys[number]
export const statNames: Record<Stat, string> = {control:'반동 제어',handling:'조작 속도',stability:'안정성',accuracy:'지향 정밀도'}
export const slotNames: Record<string,string> = {rear_grip:'후방 손잡이',foregrip:'전방 손잡이',barrel:'총열',muzzle:'총구',stock:'개머리판',magazine:'탄창',mag_mount:'탄창 보조',right_rail:'우측 레일',left_patch:'좌측 패널',right_patch:'우측 패널',upper_rail:'상단 레일',charging_handle:'장전 손잡이',tactical_device:'전술 장비'}
export interface Part {id:string; name:string; slot:string; deltas:Partial<Record<Stat,number|null>>; source:string; note:string}
export interface Weapon {name:string; base: Record<string,number|null>|null; codes: {code:string; label:string}[]; parts: Part[]}
const numeric = (value:unknown):number|null => (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) ? null : Number(value)
const bases = new Map(seed.verified_weapon_base_partial.filter(row=>row.mode==='Warfare').map(row=>[row.weapon,row]))
const parts = new Map<string,Part>()
const byWeapon = new Map<string,Set<string>>()
for(const p of grips.attachments) {
 if(p.mode!=='Warfare')continue
 const deltas = Object.fromEntries(statKeys.map(key=>[key,numeric(p.displayed_deltas[key])])) as Part['deltas']
 parts.set(p.id,{id:p.id,name:p.name_cn,slot:p.slot,deltas,source:'DFTTK 전면전 편집기',note:'사이트 표시값 · 게임 내 미검증'})
}
for(const row of grips.weapon_attachment_observations) {
 if(!parts.has(row.attachment_id))continue
 if(!byWeapon.has(row.weapon))byWeapon.set(row.weapon,new Set())
 byWeapon.get(row.weapon)!.add(row.attachment_id)
}
for(const [index,p] of seed.confirmed_akm_attachment_examples.filter(row=>row.mode==='Warfare').entries()){
 const id='akm:'+index
 parts.set(id,{id,name:p.attachment,slot:p.slot,deltas:{},source:'Aim Sector 전면전 예시',note:p.effect_description})
 if(!byWeapon.has('AKM'))byWeapon.set('AKM',new Set())
 byWeapon.get('AKM')!.add(id)
}
export const weapons:Weapon[]=seed.weapons.map(name=>{
 const base=bases.get(name)
 return {
  name,
  base:base?Object.fromEntries(['damage','range_m','control','handling','stability','accuracy','rpm','capacity','ads_ms'].map(key=>[key,numeric(base[key as keyof typeof base])])):null,
  codes:seed.loadouts.filter(row=>row.mode==='Warfare'&&row.weapon===name).map(row=>({code:row.loadout_code,label:row.build_label})),
  parts:[...(byWeapon.get(name)??[])].map(id=>parts.get(id)!).filter(Boolean),
 }
})
/** Unknown effects are null, never silently treated as zero in final values. */
export function calculate(weapon:Weapon,selection:Record<string,string>) {
 const chosen=Object.values(selection).map(id=>weapon.parts.find(part=>part.id===id))
 if(chosen.some(part=>!part))throw Error('해당 총기의 관측 파츠가 아닙니다')
 if(new Set(chosen.map(part=>part!.slot)).size!==chosen.length)throw Error('동일 슬롯 중복')
 return Object.fromEntries(statKeys.map(key=>{
  const base=weapon.base?.[key]??null
  const unknown=chosen.some(part=>part!.deltas[key]===undefined||part!.deltas[key]===null)
  const knownDelta=chosen.reduce((n,part)=>n+(part!.deltas[key]??0),0)
  return [key,{base,knownDelta,final:base!==null&&!unknown?base+knownDelta:null}]
 })) as Record<Stat,{base:number|null;knownDelta:number;final:number|null}>
}
export const metadata = {mode:'Warfare',date:seed.manifest.as_of,season:seed.manifest.season,complete:false}
