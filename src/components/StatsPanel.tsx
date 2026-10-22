import { useState } from 'react'
import { catalog, statLabels } from '../data/catalog'
import { equippedParts } from '../lib/stats'
import { statKeys, type Loadout, type Stats, type Weapon } from '../types'
import { Icon } from './Icon'

function Radar({ base, current }: { base: Stats; current: Stats }) {
  const point = (i: number, value: number) => {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 5
    return `${150 + Math.cos(angle) * value},${137 + Math.sin(angle) * value}`
  }
  const polygon = (stats: Stats) => statKeys.map((key, i) => point(i, stats[key] * .9)).join(' ')
  return <svg className="radar" viewBox="0 0 300 275" role="img" aria-label="기본 및 개조 능력치 비교 레이더 그래프. 정확한 값은 아래 목록에 표시됩니다.">
    {[.25, .5, .75, 1].map(scale => <polygon key={scale} points={statKeys.map((_, i) => point(i, scale * 90)).join(' ')} fill="none" stroke="#2c3831" />)}
    {statKeys.map((_, i) => <line key={i} x1="150" y1="137" x2={point(i, 90).split(',')[0]} y2={point(i, 90).split(',')[1]} stroke="#2c3831" />)}
    <polygon points={polygon(base)} fill="#93a39b12" stroke="#74867c" strokeDasharray="4 4" />
    <polygon points={polygon(current)} fill="#b8f46b20" stroke="#bef574" strokeWidth="2" />
    {statKeys.map((key, i) => {
      const [x, y] = point(i, 120).split(',')
      return <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#9ca9a1" fontSize="11">{statLabels[key]}</text>
    })}
  </svg>
}

export function StatsPanel({ weapon, loadout, current }: { weapon: Weapon; loadout: Loadout; current: Stats }) {
  const [chart, setChart] = useState<'bars' | 'radar'>('bars')
  const parts = equippedParts(loadout, catalog.attachments)
  return <aside className="stats-panel panel" aria-label="능력치 비교">
    <div className="panel-heading"><h2>성능 분석</h2><Icon name="target" size={18} /></div>
    <div className="analysis-heading"><span className="eyebrow">BUILD PERFORMANCE</span><h3>변화를 한눈에.</h3><p>장착한 부착물의 효과를 비교하세요.</p></div>
    <div className="chart-toggle" aria-label="그래프 형식"><button aria-pressed={chart === 'bars'} className={chart === 'bars' ? 'active' : ''} onClick={() => setChart('bars')}>막대 그래프</button><button aria-pressed={chart === 'radar'} className={chart === 'radar' ? 'active' : ''} onClick={() => setChart('radar')}>레이더 그래프</button></div>
    <div className="chart-legend"><span><i className="base-key" />기본</span><span><i className="current-key" />개조 후</span><span className="mono">0 — 100</span></div>
    {chart === 'radar' && <Radar base={weapon.stats} current={current} />}
    <div className={`stats-list ${chart === 'radar' ? 'compact-stats' : ''}`} aria-live="polite" aria-atomic="true">
      {statKeys.map(key => {
        const delta = current[key] - weapon.stats[key]
        return <div className="stat-row" key={key} data-testid={`stat-${key}`}>
          <div className="stat-label"><span>{statLabels[key]}</span><div><span className="base-value">{weapon.stats[key]}</span><span className="value-arrow">→</span><strong data-testid={`current-${key}`}>{current[key]}</strong><span className={`stat-delta ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'muted'}`}>{delta > 0 ? '+' : ''}{delta === 0 ? '—' : delta}</span></div></div>
          {chart === 'bars' && <div className="stat-track"><div className="base-bar" style={{ width: `${weapon.stats[key]}%` }} /><div className="current-bar" style={{ width: `${current[key]}%` }} /><span className="base-marker" style={{ left: `${weapon.stats[key]}%` }} /></div>}
        </div>
      })}
    </div>
    <div className="stat-footnote">샘플 점수 · 모든 항목은 높을수록 좋음</div>
    <section className="contribution"><h3>부착물별 변화량 <span className="count-badge">{parts.length}</span></h3>
      {parts.length === 0 ? <p className="contribution-empty">부착물을 장착하면<br />각 부품의 변화량이 여기에 표시됩니다.</p> : <ul>{parts.map(part => <li key={part.id}><strong>{part.name}</strong><div>{statKeys.filter(key => part.modifiers[key]).map(key => <span key={key} className={(part.modifiers[key] ?? 0) > 0 ? 'positive' : 'negative'}>{statLabels[key]} {(part.modifiers[key] ?? 0) > 0 ? '+' : ''}{part.modifiers[key]}</span>)}</div></li>)}</ul>}
    </section>
    <div className="formula-note"><Icon name="info" size={16} /><p>기본값 + 부착물 변화량 합계<br /><span>결과는 0~100으로 제한됩니다.<br />실제 게임 계산식이 아닙니다.</span></p></div>
  </aside>
}
