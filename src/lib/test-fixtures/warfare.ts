import type { Evidence, WarfareWeapon } from '../../types/warfare'

/** Synthetic test inputs only. No game or external-site data; never imported by the app. */
export function mathFixture(): WarfareWeapon {
  const evidence: Evidence = { status: 'observed', sourceUrl: 'https://example.com/test-fixture', sourceName: 'TestFixture',
    observedAt: '2026-01-01', kind: 'site-base', gameVersion: null, dataVersion: 'test-only', gameVerified: false, verifiedAt: null }
  return {
    id: 'fixture:weapon', sourceId: null, dataset: 'warfare', mode: 'Warfare', name: '계산 검사 전용', category: null, evidence,
    base: { control: 20, handling: 30, stability: 40, accuracy: 50, damage: null, range_m: null, rpm: null, capacity: null, ads_ms: null, sprint_to_fire_ms: null, ads_move_mps: null },
    baseEvidence: evidence,
    slots: [{ id: 'rear_grip', defaultAttachmentId: null, defaultStatus: 'unknown', evidence }],
    coverage: { slotsComplete: false, compatibilityComplete: false }, codes: [], calibrations: [], observedCombinations: [], compatibilityRules: [],
    parts: [
      { id: 'fixture:alpha', sourceId: null, dataset: 'warfare', mode: 'Warfare', name: '검사 부품 A', slot: 'rear_grip', observedWeaponIds: ['fixture:weapon'], deltas: { control: 0, handling: 4, stability: -2, accuracy: 0 }, source: 'TestFixture', note: '가상 테스트 입력', evidence, tunable: null },
      { id: 'fixture:beta', sourceId: null, dataset: 'warfare', mode: 'Warfare', name: '검사 부품 B', slot: 'rear_grip', observedWeaponIds: ['fixture:weapon'], deltas: { control: 5 }, source: 'TestFixture', note: '가상 테스트 입력', evidence, tunable: null },
    ],
  }
}
