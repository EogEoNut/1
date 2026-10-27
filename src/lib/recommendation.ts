import type { VerificationStatus, WarfareLoadout, WarfareWeapon } from '../types/warfare'

export type PlayStyle = 'recoil' | 'distance' | 'mobility' | 'balanced' | 'beginner'
export type ScoringMetric = 'control' | 'handling' | 'stability' | 'accuracy' | 'range_m' | 'ads_move_mps'
export interface StyleProfile { label: string; weights: Partial<Record<ScoringMetric, number>> }
export const styleProfiles: Record<PlayStyle, StyleProfile> = {
  recoil: { label: '반동 제어 중심', weights: { control: .6, stability: .25, handling: .15 } },
  distance: { label: '중장거리 교전 중심', weights: { range_m: .45, accuracy: .35, stability: .2 } },
  mobility: { label: '근거리 기동성 중심', weights: { handling: .65, ads_move_mps: .35 } },
  balanced: { label: '안정성과 조작성의 균형', weights: { control: .3, handling: .35, stability: .35 } },
  beginner: { label: '초보자 친화형', weights: { control: .5, stability: .35, handling: .15 } },
}
export const scoringLabels: Record<ScoringMetric, string> = {
  control: '반동 제어', handling: '조작성', stability: '안정성', accuracy: '지향 정밀도',
  range_m: '사거리', ads_move_mps: '조준 이동 속도',
}
export const scoreModel = {
  id: 'delta-lab-weights-v1',
  notice: 'DELTA LAB 자체 평가 모델이며 게임 공식 성능 점수가 아닙니다.',
  // These are product rating reference intervals, never game limits or formulas.
  scales: { control: 10, handling: 10, stability: 10, accuracy: 10, range_m: 10, ads_move_mps: 1 } satisfies Record<ScoringMetric, number>,
}
export interface ScoredValue { base: number | null; value: number | null; status: VerificationStatus }

/** Consumes future verified calculation outputs. Observed reference sums cannot enter ranking. */
export function scoreVerifiedMetrics(style: PlayStyle, values: Partial<Record<ScoringMetric, ScoredValue>>): number | null {
  let sum = 0
  let totalWeight = 0
  for (const [key, weight] of Object.entries(styleProfiles[style].weights)) {
    const metric = key as ScoringMetric
    const item = values[metric]
    if (!item || item.status !== 'verified' || item.base === null || item.value === null
      || !Number.isFinite(item.base) || !Number.isFinite(item.value)) return null
    sum += Math.max(-1, Math.min(1, (item.value - item.base) / scoreModel.scales[metric])) * weight!
    totalWeight += weight!
  }
  return Math.round(Math.max(0, Math.min(100, 50 + 50 * sum / totalWeight)) * 10) / 10
}

export function recommendationReadiness(weapon: WarfareWeapon, style: PlayStyle) {
  const reasons: string[] = []
  if (!weapon.coverage.slotsComplete || weapon.slots.some(slot => slot.defaultStatus === 'unknown')) reasons.push('전체 슬롯과 기본 장착 부품 자료가 부족합니다.')
  if (!weapon.coverage.compatibilityComplete) reasons.push('전체 호환·충돌·종속 조건이 확인되지 않았습니다.')
  if (weapon.baseEvidence?.status !== 'verified' || !weapon.parts.length || weapon.parts.some(part => part.evidence.status !== 'verified')) reasons.push('게임 내 검증된 기본 수치와 부착물 효과가 필요합니다.')
  for (const key of Object.keys(styleProfiles[style].weights)) {
    if (weapon.base?.[key as ScoringMetric] == null) reasons.push(`${scoringLabels[key as ScoringMetric]} 기본 수치가 미확인입니다.`)
  }
  // The current calculator is reference-additive; no verified game strategy exists yet.
  reasons.push('검증된 게임 계산 전략이 아직 연결되지 않았습니다.')
  return { ready: false as const, reasons, recommendations: [] as Recommendation[], modelId: scoreModel.id }
}
export interface Recommendation {
  selection: WarfareLoadout
  score: number
  reasons: string[]
  advantages: string[]
  disadvantages: string[]
}
/** Extension point for a future search engine or AI provider; at most three results. */
export interface RecommendationProvider {
  recommend(input: { weapon: WarfareWeapon; style: PlayStyle; limit: 1 | 2 | 3 }): Promise<{
    status: 'ready' | 'insufficient-data'
    modelId: string
    recommendations: Recommendation[]
    reasons: string[]
  }>
}
