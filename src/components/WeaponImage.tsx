import { useState } from 'react'
import registrations from '../data/weapon-images.json'
import { WeaponArt } from './WeaponArt'
import { Icon } from './Icon'

interface Registration { src: string; alt: string; credit?: string }
function registeredImage(id: string): Registration | null {
  const item = (registrations as Record<string, unknown>)[id]
  if (!item || typeof item !== 'object') return null
  const record = item as Record<string, unknown>
  if (typeof record.src !== 'string' || !record.src.startsWith('images/') || record.src.includes('..') || record.src.includes('\\') || record.src.includes(':')) return null
  if (typeof record.alt !== 'string' || !record.alt.trim()) return null
  return { src: `${import.meta.env.BASE_URL}${record.src}`, alt: record.alt, credit: typeof record.credit === 'string' ? record.credit : undefined }
}

/** Original reference artwork is separate from game/source data and replaceable by user images. */
export function WeaponImage({ id, name, category }: { id: string; name: string; category: string | null }) {
  const custom = registeredImage(id)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const variant = category === 'smg' ? 'smg' : category === 'marksman' || category === 'sniper' ? 'dmr'
    : ['assault_rifle', 'battle_rifle', 'lmg', 'shotgun'].includes(category ?? '') ? 'rifle' : null
  const customVisible = custom && custom.src !== failedSrc
  return <figure className="weapon-preview" aria-label={`${name} 총기 이미지`}>
    {customVisible ? <img src={custom.src} alt={custom.alt} onError={() => setFailedSrc(custom.src)} />
      : variant ? <WeaponArt variant={variant} label={`${name} 참고 이미지. 자체 제작한 총기 종류 도식이며 실제 게임 모델이 아닙니다.`} />
      : <div className="weapon-image-empty"><Icon name="target" size={36} /><span>이 총기의 이미지는 아직 등록되지 않았습니다.</span></div>}
    <figcaption>{customVisible ? custom.credit ?? '직접 등록한 이미지' : variant ? `${name} · 자체 제작 참고 도식 (실제 모델과 다를 수 있음)` : '이미지 직접 등록 가능'}{custom && !customVisible && <span role="status">등록 이미지를 불러오지 못해 기본 표시로 전환했습니다.</span>}</figcaption>
  </figure>
}
