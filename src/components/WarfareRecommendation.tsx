import { useState } from 'react'
import { recommendationReadiness, scoreModel, scoringLabels, styleProfiles } from '../lib/recommendation'
import type { PlayStyle, ScoringMetric } from '../lib/recommendation'
import type { WarfareWeapon } from '../types/warfare'

export function WarfareRecommendation({ weapon }: { weapon: WarfareWeapon }) {
  const [style, setStyle] = useState<PlayStyle>('balanced')
  const readiness = recommendationReadiness(weapon, style)
  return <section className="warfare-recommendation" aria-label="플레이 스타일 추천 기반">
    <h3>플레이 스타일 기반 추천 준비</h3>
    <label htmlFor="warfare-style">선호 전투 스타일</label>
    <select id="warfare-style" value={style} onChange={event => setStyle(event.target.value as PlayStyle)}>
      {Object.entries(styleProfiles).map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}
    </select>
    <div className="warfare-deltas" aria-live="polite">{Object.entries(styleProfiles[style].weights).map(([key, weight]) => <span key={key}>{scoringLabels[key as ScoringMetric]} {Math.round(weight! * 100)}%</span>)}</div>
    <p className="warfare-note">{scoreModel.notice} 수치 단위별 자체 기준 구간으로 정규화하는 설계이며, 자료가 확보되면 검증된 조합을 최대 3개 평가하도록 확장합니다.</p>
    <div className="warfare-empty"><strong>추천 보류 · 검증 자료 부족</strong><ul>{readiness.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul><p>현재 자료로 미검증 조합을 추천하지 않습니다.</p></div>
  </section>
}
