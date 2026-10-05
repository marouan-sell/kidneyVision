/**
 * Comprehensive Automated Test Suite: KidneyVision 4-Class Diagnostic System
 * Validates counting, proportions, denominators, confidence averages, and edge cases.
 */

import {
  computeDashboardMetrics,
  computeDiagnosticDistribution,
  computeConfidenceBuckets,
  computeTimelineData,
  computeAgeCohorts,
} from '../data/mockAnalytics';
import { MOCK_SCANS } from '../data/mockScans';
import type { ScanRecord } from '../types/scan';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertCloseTo(actual: number, expected: number, tolerance = 0.5, message = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`Assertion failed: ${message} (Actual: ${actual}, Expected: ${expected}, Diff: ${diff})`);
  }
}

export function runAllDiagnosticTests() {
  console.log('================================================================');
  console.log('  Running KidneyVision AI 4-Class Diagnostic System Tests');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}\n`);
    }
  }

  // ------------------------------------------------------------------------
  // Suite 1: MOCK_SCANS Reconciled Dataset Validation
  // ------------------------------------------------------------------------
  test('MOCK_SCANS contains all four diagnostic classes plus pending', () => {
    const normal = MOCK_SCANS.filter((s) => s.diagnosis === 'normal').length;
    const stone = MOCK_SCANS.filter((s) => s.diagnosis === 'nephrolithiasis').length;
    const cyst = MOCK_SCANS.filter((s) => s.diagnosis === 'cyst').length;
    const tumor = MOCK_SCANS.filter((s) => s.diagnosis === 'tumor').length;
    const pending = MOCK_SCANS.filter((s) => s.diagnosis === 'pending').length;

    assert(normal > 0, `Expected normal > 0, got ${normal}`);
    assert(stone > 0, `Expected stone > 0, got ${stone}`);
    assert(cyst > 0, `Expected cyst > 0, got ${cyst}`);
    assert(tumor > 0, `Expected tumor > 0, got ${tumor}`);
    assert(pending > 0, `Expected pending > 0, got ${pending}`);
    assert(MOCK_SCANS.length === normal + stone + cyst + tumor + pending, 'Total scans must equal sum of all classes');
  });

  test('computeDashboardMetrics on MOCK_SCANS reconciles rates to ~100%', () => {
    const metrics = computeDashboardMetrics(MOCK_SCANS);

    assert(metrics.totalScans === 65, `Expected 65 total scans, got ${metrics.totalScans}`);
    assert(metrics.normalScans === 26, `Expected 26 normal scans, got ${metrics.normalScans}`);
    assert(metrics.stoneScans === 18, `Expected 18 stone scans, got ${metrics.stoneScans}`);
    assert(metrics.cystScans === 11, `Expected 11 cyst scans, got ${metrics.cystScans}`);
    assert(metrics.tumorScans === 8, `Expected 8 tumor scans, got ${metrics.tumorScans}`);
    assert(metrics.pendingScans === 2, `Expected 2 pending scans, got ${metrics.pendingScans}`);
    assert(metrics.pathologyDetections === 18 + 11 + 8, `Pathology detections must equal 37, got ${metrics.pathologyDetections}`);

    const sumRates =
      metrics.normalRate +
      metrics.stonePositivityRate +
      metrics.cystRate +
      metrics.tumorRate +
      metrics.pendingRate +
      metrics.rejectedRate;

    assertCloseTo(sumRates, 100.0, 0.5, 'Sum of all category percentages must sum to 100%');
    assert(metrics.averageConfidence > 95 && metrics.averageConfidence < 100, `Mean confidence reasonable (${metrics.averageConfidence}%)`);
  });

  // ------------------------------------------------------------------------
  // Suite 2: computeDiagnosticDistribution
  // ------------------------------------------------------------------------
  test('computeDiagnosticDistribution returns all 4 classes with exact counts', () => {
    const dist = computeDiagnosticDistribution(MOCK_SCANS);
    assert(dist.length >= 5, `Expected at least 5 distribution items, got ${dist.length}`);

    const normal = dist.find((d) => d.diagnosis === 'normal');
    const stone = dist.find((d) => d.diagnosis === 'nephrolithiasis');
    const cyst = dist.find((d) => d.diagnosis === 'cyst');
    const tumor = dist.find((d) => d.diagnosis === 'tumor');
    const pending = dist.find((d) => d.diagnosis === 'pending');

    assert(Boolean(normal && normal.count === 26), 'Normal distribution item verified');
    assert(Boolean(stone && stone.count === 18), 'Stone distribution item verified');
    assert(Boolean(cyst && cyst.count === 11), 'Cyst distribution item verified');
    assert(Boolean(tumor && tumor.count === 8), 'Tumor distribution item verified');
    assert(Boolean(pending && pending.count === 2), 'Pending distribution item verified');
  });

  // ------------------------------------------------------------------------
  // Suite 3: Edge Case Testing
  // ------------------------------------------------------------------------
  test('Edge Case: Empty array returns zeros without division by zero errors', () => {
    const metrics = computeDashboardMetrics([]);
    assert(metrics.totalScans === 0, 'totalScans is 0');
    assert(metrics.normalRate === 0, 'normalRate is 0');
    assert(metrics.stonePositivityRate === 0, 'stonePositivityRate is 0');
    assert(metrics.cystRate === 0, 'cystRate is 0');
    assert(metrics.tumorRate === 0, 'tumorRate is 0');
    assert(metrics.pendingRate === 0, 'pendingRate is 0');
    assert(metrics.averageConfidence === 0, 'averageConfidence is 0');

    const dist = computeDiagnosticDistribution([]);
    assert(dist.length === 5, 'Distribution returned for empty list');
    assert(dist.every((d) => d.count === 0 && d.pct === 0), 'All items 0 in empty distribution');
  });

  test('Edge Case: Single pathology dataset (100% Tumor)', () => {
    const singleTumorScans: ScanRecord[] = [
      {
        id: 'KV-TEST-T1',
        patientAlias: 'Tumor Case',
        date: '2026-09-25',
        formattedDate: 'Today',
        laterality: 'left',
        diagnosis: 'tumor',
        confidence: 96.5,
        riskLevel: 'urgent',
        status: 'reviewed',
        patientAge: 55,
        patientSex: 'female',
        hasGradCam: true,
      },
    ];

    const metrics = computeDashboardMetrics(singleTumorScans);
    assert(metrics.totalScans === 1, 'Total scans is 1');
    assert(metrics.tumorScans === 1, 'Tumor scans is 1');
    assert(metrics.tumorRate === 100, 'Tumor rate is 100%');
    assert(metrics.normalRate === 0, 'Normal rate is 0%');
    assert(metrics.stonePositivityRate === 0, 'Stone rate is 0%');
    assert(metrics.cystRate === 0, 'Cyst rate is 0%');
    assert(metrics.tumorAverageConfidence === 96.5, 'Tumor avg confidence is 96.5%');
  });

  test('Edge Case: Scans with Gatekeeper Rejections (Rejected Non-Ultrasound)', () => {
    const rejectedScans: ScanRecord[] = [
      {
        id: 'KV-TEST-R1',
        patientAlias: 'Non-Ultrasound Photo',
        date: '2026-09-25',
        formattedDate: 'Today',
        laterality: 'left',
        diagnosis: 'rejected',
        confidence: null,
        riskLevel: 'elevated',
        status: 'reviewed',
        patientAge: 30,
        patientSex: 'male',
        hasGradCam: false,
      },
      {
        id: 'KV-TEST-N1',
        patientAlias: 'Normal Kidney',
        date: '2026-09-25',
        formattedDate: 'Today',
        laterality: 'right',
        diagnosis: 'normal',
        confidence: 99.0,
        riskLevel: 'low',
        status: 'reviewed',
        patientAge: 32,
        patientSex: 'female',
        hasGradCam: true,
      },
    ];

    const metrics = computeDashboardMetrics(rejectedScans);
    assert(metrics.totalScans === 2, 'Total scans is 2');
    assert(metrics.rejectedScans === 1, 'Rejected scans is 1');
    assert(metrics.rejectedRate === 50, 'Rejected rate is 50%');
    assert(metrics.normalRate === 50, 'Normal rate is 50%');

    const dist = computeDiagnosticDistribution(rejectedScans);
    const rejectedItem = dist.find((d) => d.diagnosis === 'rejected');
    assert(Boolean(rejectedItem && rejectedItem.count === 1 && rejectedItem.pct === 50), 'Rejected item included in distribution');
  });

  // ------------------------------------------------------------------------
  // Suite 4: computeConfidenceBuckets, Timeline, and Age Cohorts
  // ------------------------------------------------------------------------
  test('computeConfidenceBuckets accurately classifies all 4 diagnostic classes', () => {
    const buckets = computeConfidenceBuckets(MOCK_SCANS);
    assert(buckets.length === 4, '4 confidence buckets generated');

    const totalInBuckets = buckets.reduce((sum, b) => sum + b.totalCount, 0);
    // 63 scans have confidence (65 total - 2 pending with null)
    assert(totalInBuckets === 63, `Expected 63 scans in confidence buckets, got ${totalInBuckets}`);
    assert(buckets.some((b) => b.cystCount > 0), 'Cyst counts present in buckets');
    assert(buckets.some((b) => b.tumorCount > 0), 'Tumor counts present in buckets');
  });

  test('computeTimelineData and computeAgeCohorts handle all 4 classes', () => {
    const timeline = computeTimelineData(MOCK_SCANS);
    assert(timeline.length > 0, 'Timeline data points generated');
    const hasCystsInTimeline = timeline.some((t) => t.cyst > 0);
    const hasTumorsInTimeline = timeline.some((t) => t.tumor > 0);
    assert(hasCystsInTimeline, 'Timeline includes cyst counts');
    assert(hasTumorsInTimeline, 'Timeline includes tumor counts');

    const cohorts = computeAgeCohorts(MOCK_SCANS);
    assert(cohorts.length === 4, '4 age cohorts generated');
    assert(cohorts.some((c) => (c.cyst ?? 0) > 0), 'Cohorts include cyst counts');
    assert(cohorts.some((c) => (c.tumor ?? 0) > 0), 'Cohorts include tumor counts');
  });

  console.log(`\n================================================================`);
  console.log(`  Tests Completed: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    throw new Error(`${total - passed} tests failed.`);
  }
}

// Execute when run directly via tsx / node
runAllDiagnosticTests();
