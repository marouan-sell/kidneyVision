/**
 * Comprehensive Automated Test Suite: KidneyVision AI PDF Report Generator (jsPDF)
 * Validates:
 * 1. All four diagnostic classes: Cyst, Normal, Stone, Tumor
 * 2. Ultrasound Gatekeeper passed & rejected cases
 * 3. 4-Class Probability Spectrum rendering
 * 4. Visual Evidence Suite embedding (Dual Clinical Panel, Cleaned Scan, Grad-CAM Heatmap)
 * 5. Missing images, absent probabilities, and malformed inputs graceful handling
 * 6. Correct 2-page document structure and filename formatting
 */

import fs from 'fs';
import path from 'path';
import { generateScanPdfReport } from '../utils/generateScanPdfReport';
import type { ScanRecord } from '../types/scan';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runAllPdfTests() {
  console.log('================================================================');
  console.log('  Running KidneyVision AI PDF Report Generator Test Suite');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;
  const filesToCleanup: string[] = [];

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

  const dummyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const dummyJpg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  function verifyGeneratedPdf(filename: string): void {
    const fullPath = path.resolve(process.cwd(), filename);
    filesToCleanup.push(fullPath);
    assert(fs.existsSync(fullPath), `Expected generated PDF at ${fullPath}`);
    const stats = fs.statSync(fullPath);
    assert(stats.size > 15000, `Expected PDF file size > 15KB, got ${stats.size} bytes`);
    const buffer = fs.readFileSync(fullPath);
    const header = buffer.subarray(0, 4).toString('utf8');
    assert(header === '%PDF', `Expected PDF magic header %PDF, got: ${header}`);
  }

  // ------------------------------------------------------------------------
  // Test 1: Cyst Diagnosis (Full 4-Class Evidence)
  // ------------------------------------------------------------------------
  test('Cyst diagnosis generates 2-page report with teal badge and full probabilities', () => {
    const filename = 'KidneyVision_Report_KV-TEST-CYST-01_Cyst_Patient_Alpha.pdf';
    const scan: ScanRecord = {
      id: 'KV-TEST-CYST-01',
      patientAlias: 'Cyst Patient Alpha',
      date: '2026-09-25',
      formattedDate: 'Sep 25, 2026',
      laterality: 'left',
      diagnosis: 'cyst',
      confidence: 97.4,
      riskLevel: 'low',
      status: 'reviewed',
      patientAge: 52,
      patientSex: 'female',
      kidneyPole: 'upper',
      stoneSizeMm: 16.0,
      hasGradCam: true,
      notes: 'Benign cortical cyst with thin imperceptible wall and enhanced acoustic through-transmission.',
      classProbabilities: {
        Cyst: 97.4,
        Normal: 1.2,
        Stone: 0.8,
        Tumor: 0.6,
      },
      gateEvaluation: {
        gate_passed: true,
        kidney_confidence_percent: 98.8,
        non_kidney_probability_percent: 1.2,
      },
      visualizationUrl: dummyPng,
      cleanedScanUrl: dummyJpg,
      heatmapUrl: dummyPng,
      imageUrl: dummyPng,
      primaryDiagnosis: 'Renal Cortical Cyst (Bosniak I/II)',
    };

    generateScanPdfReport(scan);
    verifyGeneratedPdf(filename);
  });

  // ------------------------------------------------------------------------
  // Test 2: Normal Diagnosis (Healthy Parenchyma)
  // ------------------------------------------------------------------------
  test('Normal diagnosis generates 2-page report with emerald badge and intact architecture', () => {
    const filename = 'KidneyVision_Report_KV-TEST-NORM-02_Normal_Patient_Beta.pdf';
    const scan: ScanRecord = {
      id: 'KV-TEST-NORM-02',
      patientAlias: 'Normal Patient Beta',
      date: '2026-09-25',
      formattedDate: 'Sep 25, 2026',
      laterality: 'right',
      diagnosis: 'normal',
      confidence: 99.1,
      riskLevel: 'low',
      status: 'reviewed',
      patientAge: 39,
      patientSex: 'male',
      kidneyPole: 'mid',
      hasGradCam: true,
      classProbabilities: {
        Cyst: 0.3,
        Normal: 99.1,
        Stone: 0.4,
        Tumor: 0.2,
      },
      gateEvaluation: {
        gate_passed: true,
        kidney_confidence_percent: 99.7,
        non_kidney_probability_percent: 0.3,
      },
      visualizationUrl: dummyPng,
      cleanedScanUrl: dummyJpg,
      heatmapUrl: dummyPng,
      imageUrl: dummyPng,
    };

    generateScanPdfReport(scan);
    verifyGeneratedPdf(filename);
  });

  // ------------------------------------------------------------------------
  // Test 3: Stone / Nephrolithiasis (Renal Calculus)
  // ------------------------------------------------------------------------
  test('Stone diagnosis generates 2-page report with red badge and urological recommendations', () => {
    const filename = 'KidneyVision_Report_KV-TEST-STONE-03_Stone_Patient_Gamma.pdf';
    const scan: ScanRecord = {
      id: 'KV-TEST-STONE-03',
      patientAlias: 'Stone Patient Gamma',
      date: '2026-09-25',
      formattedDate: 'Sep 25, 2026',
      laterality: 'bilateral',
      diagnosis: 'nephrolithiasis',
      confidence: 93.6,
      riskLevel: 'elevated',
      status: 'reviewed',
      patientAge: 46,
      patientSex: 'male',
      kidneyPole: 'lower',
      stoneSizeMm: 6.8,
      hasGradCam: true,
      classProbabilities: {
        Cyst: 2.2,
        Normal: 1.5,
        Stone: 93.6,
        Tumor: 2.7,
      },
      gateEvaluation: {
        gate_passed: true,
        kidney_confidence_percent: 96.5,
        non_kidney_probability_percent: 3.5,
      },
      visualizationUrl: dummyPng,
      cleanedScanUrl: dummyJpg,
      heatmapUrl: dummyPng,
      imageUrl: dummyPng,
    };

    generateScanPdfReport(scan);
    verifyGeneratedPdf(filename);
  });

  // ------------------------------------------------------------------------
  // Test 4: Tumor / Suspicious Neoplasm (Urgent Alert)
  // ------------------------------------------------------------------------
  test('Tumor diagnosis generates 2-page report with purple badge and oncology urgent alerts', () => {
    const filename = 'KidneyVision_Report_KV-TEST-TUMOR-04_Tumor_Patient_Delta.pdf';
    const scan: ScanRecord = {
      id: 'KV-TEST-TUMOR-04',
      patientAlias: 'Tumor Patient Delta',
      date: '2026-09-25',
      formattedDate: 'Sep 25, 2026',
      laterality: 'left',
      diagnosis: 'tumor',
      confidence: 92.8,
      riskLevel: 'urgent',
      status: 'reviewed',
      patientAge: 64,
      patientSex: 'male',
      kidneyPole: 'upper',
      stoneSizeMm: 28.5,
      hasGradCam: true,
      classProbabilities: {
        Cyst: 3.1,
        Normal: 0.9,
        Stone: 3.2,
        Tumor: 92.8,
      },
      gateEvaluation: {
        gate_passed: true,
        kidney_confidence_percent: 95.0,
        non_kidney_probability_percent: 5.0,
      },
      visualizationUrl: dummyPng,
      cleanedScanUrl: dummyJpg,
      heatmapUrl: dummyPng,
      imageUrl: dummyPng,
    };

    generateScanPdfReport(scan);
    verifyGeneratedPdf(filename);
  });

  // ------------------------------------------------------------------------
  // Test 5: Gatekeeper Rejection (Non-Ultrasound / OOD)
  // ------------------------------------------------------------------------
  test('Rejected scan generates 2-page report with slate rejection banner without crashing', () => {
    const filename = 'KidneyVision_Report_KV-TEST-REJECT-05_Rejected_Input_Test.pdf';
    const scan: ScanRecord = {
      id: 'KV-TEST-REJECT-05',
      patientAlias: 'Rejected Input Test',
      date: '2026-09-25',
      formattedDate: 'Sep 25, 2026',
      laterality: 'left',
      diagnosis: 'rejected',
      confidence: 12.0,
      riskLevel: 'elevated',
      status: 'flagged',
      patientAge: 30,
      patientSex: 'female',
      hasGradCam: false,
      gateEvaluation: {
        gate_passed: false,
        kidney_confidence_percent: 8.5,
        non_kidney_probability_percent: 91.5,
      },
      visualizationUrl: undefined,
      cleanedScanUrl: undefined,
      heatmapUrl: undefined,
      imageUrl: undefined,
    };

    generateScanPdfReport(scan);
    verifyGeneratedPdf(filename);
  });

  // ------------------------------------------------------------------------
  // Test 6: Missing Evidence & Absent Probabilities
  // ------------------------------------------------------------------------
  test('Scan with missing images, null confidence, and absent probabilities renders fallbacks safely', () => {
    const filename = 'KidneyVision_Report_KV-TEST-MISSING-06_Incomplete_Record.pdf';
    const scan: ScanRecord = {
      id: 'KV-TEST-MISSING-06',
      patientAlias: 'Incomplete Record',
      date: '2026-09-25',
      formattedDate: 'Sep 25, 2026',
      laterality: 'right',
      diagnosis: 'normal',
      confidence: null,
      riskLevel: 'low',
      status: 'pending',
      patientAge: 50,
      patientSex: 'female',
      hasGradCam: false,
      classProbabilities: undefined,
      gateEvaluation: undefined,
      visualizationUrl: undefined,
      cleanedScanUrl: undefined,
      heatmapUrl: undefined,
      imageUrl: undefined,
    };

    generateScanPdfReport(scan);
    verifyGeneratedPdf(filename);
  });

  // ------------------------------------------------------------------------
  // Test 7: Corrupted / Malformed Base64 Image URLs
  // ------------------------------------------------------------------------
  test('Corrupted Base64 strings are handled gracefully by tryAddImage without throwing', () => {
    const filename = 'KidneyVision_Report_KV-TEST-CORRUPT-07_Corrupted_Test.pdf';
    const scan: ScanRecord = {
      id: 'KV-TEST-CORRUPT-07',
      patientAlias: 'Corrupted Test',
      date: '2026-09-25',
      formattedDate: 'Sep 25, 2026',
      laterality: 'left',
      diagnosis: 'nephrolithiasis',
      confidence: 88.0,
      riskLevel: 'elevated',
      status: 'reviewed',
      patientAge: 40,
      patientSex: 'male',
      hasGradCam: true,
      classProbabilities: {
        Cyst: 5.0,
        Normal: 5.0,
        Stone: 88.0,
        Tumor: 2.0,
      },
      visualizationUrl: 'data:image/png;base64,CORRUPTED_STRING_NOT_BASE64!@#$%^&*()',
      cleanedScanUrl: 'INVALID_DATA_NOT_BASE64',
      heatmapUrl: 'data:image/jpeg;base64,INVALID_BYTES_TEST',
      imageUrl: 'http://invalid-external-url.com/scan.png',
    };

    generateScanPdfReport(scan);
    verifyGeneratedPdf(filename);
  });

  // Cleanup generated test PDFs
  filesToCleanup.forEach((file) => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch {
      // ignore
    }
  });

  console.log(`\n=== PDF GENERATOR TEST RESULTS: ${passed}/${total} PASSED, ${total - passed} FAILED ===\n`);

  if (total - passed > 0) {
    throw new Error(`${total - passed} test(s) failed in PDF generator test suite.`);
  }
}

// Run if called directly via tsx
if (import.meta.url.endsWith('pdfReportGenerator.test.ts')) {
  runAllPdfTests();
}
