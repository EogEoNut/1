import { useId } from 'react'
import type { Weapon } from '../types'

// Original schematic illustration. It is not a depiction of an actual game asset.
export function WeaponArt({ variant, compact = false, hasOptic = false, label = '샘플 총기 가상 도식. 실제 게임 모델이 아닙니다.' }: { variant: Weapon['silhouette']; compact?: boolean; hasOptic?: boolean; label?: string }) {
  const id = useId().replace(/:/g, '')
  const isSmg = variant === 'smg'
  const isDmr = variant === 'dmr'
  return <svg className={`weapon-art ${compact ? 'compact-art' : ''}`} viewBox="0 0 720 280" role="img" aria-label={label}>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#71817c" /><stop offset=".48" stopColor="#3b4944" /><stop offset="1" stopColor="#202d28" /></linearGradient>
    </defs>
    <g fill={`url(#${id})`} stroke="#82958b" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M55 121h107l51 15v33h-50l-25 31H57l-9-8 11-18-4-19z" />
      <path d="M66 134h68l29 12v14l-33 29H70l12-24z" fill="#17231f" />
      <path d="M166 130h54v35h-54z" />
      <path d={isSmg ? 'M213 120h205l16 20-17 34H215z' : 'M213 116h218l14 16-12 43H214z'} />
      <path d="m232 174 26 2 5 24-20 42-27-9 17-37z" />
      <path d="M268 173h56l-6 25h-44z" fill="#15221c" />
      <path d="m279 176 1 15h25l4-15" fill="none" />
      <path d={isSmg ? 'm340 173 27-1 6 79-29 1z' : 'm337 173 48-2 10 65-43 14-7-32z'} />
      <path d={isSmg ? 'M414 122h86v42h-85z' : 'M428 122h129v42H428z'} />
      <path d={isDmr ? 'M558 137h105v13H558z' : isSmg ? 'M500 137h67v13h-67z' : 'M558 137h64v13h-64z'} />
      <path d={isDmr ? 'M660 132h29v23h-29z' : isSmg ? 'M566 132h24v23h-24z' : 'M620 132h30v23h-30z'} />
      <path d="M233 108h197v9H233z" />
      {!isSmg && <path d="M448 113h93v9h-93z" />}
      <path d="M257 111V98h18v13M413 111V98h11v13" />
      {(hasOptic || isDmr) && <><path d="M312 107V88h61v19z" /><path d="M298 72h95v21h-95z" /><path d="M298 68h17v30h-17zm80 0h15v30h-15z" /></>}
      <path d="M240 131h81v22h-81z" fill="#27372f" />
      <path d="M337 136h57v8h-57z" fill="#17231f" />
      {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${442 + i * 10} 132v22`} opacity=".65" />)}
      <path d="m357 188 7 45m8-47 7 42M244 204l-11 24" opacity=".5" />
      <circle cx="229" cy="162" r="3" fill="#b4c8bb" /><circle cx="412" cy="160" r="3" fill="#b4c8bb" />
    </g>
    {!compact && <g fill="#9daf9d" opacity=".65" fontSize="9" fontFamily="monospace"><text x="242" y="145">DL / 01</text><path d="M48 256h641" stroke="#668572" strokeDasharray="3 7" opacity=".3" /><text x="49" y="274">CONCEPT SCHEMATIC</text><text x="593" y="274">NOT TO SCALE</text></g>}
  </svg>
}
