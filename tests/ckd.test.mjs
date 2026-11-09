import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ageAt, egfrCreatinine, egfrCystatin, gStage, aStage, riskLevel, standardWeight, dietTargets, bpTarget, egfrSlopePerYear,
} from '../js/ckd.js';

test('ageAt: 誕生日前後で満年齢が変わる', () => {
  assert.equal(ageAt('1960-05-10', '2026-05-09'), 65);
  assert.equal(ageAt('1960-05-10', '2026-05-10'), 66);
  assert.equal(ageAt('', '2026-05-10'), null);
});

test('egfrCreatinine: 日本人向け推算式', () => {
  // 194 × 1.0^-1.094 × 60^-0.287 ≈ 59.9
  assert.equal(egfrCreatinine({ cr: 1.0, age: 60, sex: 'male' }), 59.9);
  // 女性は ×0.739
  assert.equal(egfrCreatinine({ cr: 1.0, age: 60, sex: 'female' }), 44.3);
  assert.equal(egfrCreatinine({ cr: 0, age: 60, sex: 'male' }), null);
  assert.equal(egfrCreatinine({ cr: 1, age: 17, sex: 'male' }), null);
});

test('egfrCystatin: 日本人向け推算式', () => {
  // 104 × 1^-1.019 × 0.996^60 − 8 ≈ 73.8
  assert.equal(egfrCystatin({ cys: 1.0, age: 60, sex: 'male' }), 73.8);
  assert.equal(egfrCystatin({ cys: 1.0, age: 60, sex: 'female' }), 68.0);
});

test('gStage: 境界値', () => {
  assert.equal(gStage(90), 'G1');
  assert.equal(gStage(89.9), 'G2');
  assert.equal(gStage(60), 'G2');
  assert.equal(gStage(59.9), 'G3a');
  assert.equal(gStage(45), 'G3a');
  assert.equal(gStage(44.9), 'G3b');
  assert.equal(gStage(30), 'G3b');
  assert.equal(gStage(29.9), 'G4');
  assert.equal(gStage(15), 'G4');
  assert.equal(gStage(14.9), 'G5');
  assert.equal(gStage(null), null);
});

test('aStage: アルブミン優先、なければ蛋白', () => {
  assert.equal(aStage({ uacr: 29.9 }), 'A1');
  assert.equal(aStage({ uacr: 30 }), 'A2');
  assert.equal(aStage({ uacr: 300 }), 'A3');
  assert.equal(aStage({ upcr: 0.14 }), 'A1');
  assert.equal(aStage({ upcr: 0.15 }), 'A2');
  assert.equal(aStage({ upcr: 0.5 }), 'A3');
  assert.equal(aStage({ uacr: '', upcr: '0.6' }), 'A3');
  assert.equal(aStage({}), null);
});

test('riskLevel: ヒートマップ', () => {
  assert.equal(riskLevel('G2', 'A1'), 0);
  assert.equal(riskLevel('G3a', 'A1'), 1);
  assert.equal(riskLevel('G3b', 'A1'), 2);
  assert.equal(riskLevel('G3a', 'A3'), 3);
  assert.equal(riskLevel('G4', 'A1'), 3);
  assert.equal(riskLevel('G2', null), null);
});

test('dietTargets: ステージ別の目安と上書き', () => {
  assert.equal(standardWeight(160), 56.3);
  const g2 = dietTargets({ g: 'G2', heightCm: 160 });
  assert.equal(g2.saltMax, 6);
  assert.equal(g2.protein, null);
  assert.equal(g2.potassium, null);
  assert.equal(dietTargets({ g: 'G3a', heightCm: 160 }).protein, 56.3);
  const g4 = dietTargets({ g: 'G4', heightCm: 160 });
  assert.equal(g4.protein, 45);
  assert.equal(g4.potassium, 1500);
  assert.equal(dietTargets({ g: 'G3b', heightCm: 160 }).potassium, 2000);
  assert.equal(dietTargets({ g: 'G4', heightCm: 160, overrides: { protein: '40', water: '' } }).protein, 40);
});

test('bpTarget', () => {
  assert.deepEqual(bpTarget('A1'), { sys: 140, dia: 90 });
  assert.deepEqual(bpTarget('A2'), { sys: 130, dia: 80 });
});

test('egfrSlopePerYear', () => {
  const pts = [
    { date: '2024-01-01', value: 60 },
    { date: '2025-01-01', value: 55 },
    { date: '2026-01-01', value: 50 },
  ];
  assert.equal(egfrSlopePerYear(pts), -5);
  assert.equal(egfrSlopePerYear([{ date: '2026-01-01', value: 50 }]), null);
  assert.equal(egfrSlopePerYear([{ date: '2026-01-01', value: 50 }, { date: '2026-01-10', value: 48 }]), null);
});
