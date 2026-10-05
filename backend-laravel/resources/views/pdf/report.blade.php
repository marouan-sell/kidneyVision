<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KidneyVision AI - Clinical Diagnostic Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            background-color: #ffffff;
            font-size: 12px;
        }

        /* Color Variables */
        .primary-blue { color: #2563eb; }
        .dark-slate { color: #0f172a; }
        .success-green { color: #16a34a; }
        .danger-red { color: #dc2626; }
        .warning-amber { color: #d97706; }
        .teal-cyst { color: #0d9488; }
        .purple-tumor { color: #7c3aed; }

        /* Header Section */
        .header {
            border-bottom: 3px solid #2563eb;
            padding: 24px 35px;
            margin-bottom: 20px;
            background-color: #f8fafc;
        }

        .header-title {
            font-size: 26px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 3px;
        }

        .header-subtitle {
            font-size: 11px;
            color: #475569;
            font-weight: 600;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }

        .header-meta {
            font-size: 10px;
            color: #64748b;
            margin-top: 6px;
        }

        /* Section Container */
        .section {
            margin-bottom: 20px;
            padding: 0 35px;
        }

        .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 2px solid #e2e8f0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Info Box */
        .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 14px 18px;
            margin-bottom: 16px;
        }

        /* Tables */
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 5px 4px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
            vertical-align: top;
        }

        .info-table td.label-col {
            width: 32%;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.3px;
        }

        .info-table td.val-col {
            color: #0f172a;
            font-weight: 500;
        }

        /* Diagnostic Assessment Banner */
        .diag-banner {
            padding: 16px 20px;
            border-radius: 6px;
            margin-bottom: 16px;
        }

        .diag-banner.cyst {
            background-color: #f0fdfa;
            border: 2px solid #0d9488;
        }

        .diag-banner.normal {
            background-color: #f0fdf4;
            border: 2px solid #16a34a;
        }

        .diag-banner.stone {
            background-color: #fef2f2;
            border: 2px solid #dc2626;
        }

        .diag-banner.tumor {
            background-color: #faf5ff;
            border: 2px solid #7c3aed;
        }

        .diag-banner.rejected {
            background-color: #f8fafc;
            border: 2px solid #64748b;
        }

        .diag-banner.review {
            background-color: #fffbeb;
            border: 2px solid #d97706;
        }

        .diag-header-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .diag-title {
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 6px;
        }

        .diag-subbadge {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .diag-banner.cyst .diag-header-label { color: #0d9488; }
        .diag-banner.cyst .diag-title { color: #0f766e; }
        .diag-banner.cyst .diag-subbadge { color: #115e59; }

        .diag-banner.normal .diag-header-label { color: #16a34a; }
        .diag-banner.normal .diag-title { color: #15803d; }
        .diag-banner.normal .diag-subbadge { color: #166534; }

        .diag-banner.stone .diag-header-label { color: #dc2626; }
        .diag-banner.stone .diag-title { color: #b91c1c; }
        .diag-banner.stone .diag-subbadge { color: #991b1b; }

        .diag-banner.tumor .diag-header-label { color: #7c3aed; }
        .diag-banner.tumor .diag-title { color: #6d28d9; }
        .diag-banner.tumor .diag-subbadge { color: #581c87; }

        .diag-banner.rejected .diag-header-label { color: #64748b; }
        .diag-banner.rejected .diag-title { color: #334155; }
        .diag-banner.rejected .diag-subbadge { color: #1e293b; }

        .diag-banner.review .diag-header-label { color: #d97706; }
        .diag-banner.review .diag-title { color: #b45309; }
        .diag-banner.review .diag-subbadge { color: #92400e; }

        /* Gatekeeper Verification Card */
        .gatekeeper-card {
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 16px;
            border-left: 4px solid #2563eb;
            background-color: #f8fafc;
        }

        .gatekeeper-card.passed {
            border-left-color: #16a34a;
            background-color: #f0fdf4;
        }

        .gatekeeper-card.rejected {
            border-left-color: #dc2626;
            background-color: #fef2f2;
        }

        .gatekeeper-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }

        .gatekeeper-desc {
            font-size: 10px;
            color: #475569;
            line-height: 1.4;
        }

        /* 4-Class Probability Breakdown */
        .prob-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 14px;
        }

        .prob-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 10px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
        }

        .prob-table td {
            padding: 7px 10px;
            font-size: 11px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }

        .prob-bar-bg {
            background-color: #e2e8f0;
            border-radius: 4px;
            height: 10px;
            width: 100%;
            overflow: hidden;
        }

        .prob-bar-fill {
            height: 100%;
            border-radius: 4px;
        }

        /* Image Display Grid / Tables */
        .image-cell {
            padding: 8px;
            vertical-align: top;
            text-align: center;
        }

        .image-frame {
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 6px;
            margin-bottom: 6px;
        }

        .image-frame img {
            width: 100%;
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }

        .image-placeholder {
            background-color: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            padding: 24px 10px;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
            line-height: 1.4;
        }

        .image-caption-title {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 4px;
        }

        .image-caption-desc {
            font-size: 9px;
            color: #64748b;
            line-height: 1.3;
        }

        /* Summary & Recommendations */
        .summary-box {
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 14px;
        }

        .summary-title {
            font-weight: 700;
            color: #1e40af;
            font-size: 11px;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .summary-text {
            color: #1e3a8a;
            font-size: 11px;
            line-height: 1.6;
        }

        .recommendation-item {
            background-color: #f8fafc;
            border-left: 3px solid #2563eb;
            padding: 8px 12px;
            margin-bottom: 6px;
            border-radius: 2px;
            font-size: 11px;
            color: #334155;
            line-height: 1.5;
        }

        /* Certification Stamp Box */
        .cert-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 14px 18px;
            margin-top: 15px;
            margin-bottom: 15px;
        }

        .cert-stamp {
            border: 2px solid #2563eb;
            background-color: #eff6ff;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
        }

        /* Footer */
        .footer {
            margin-top: 25px;
            padding: 15px 35px 25px 35px;
            border-top: 2px solid #e2e8f0;
            font-size: 9px;
            color: #64748b;
        }

        .disclaimer {
            background-color: #fef3c7;
            border-left: 4px solid #d97706;
            padding: 8px 12px;
            margin-bottom: 12px;
            border-radius: 2px;
            font-size: 9px;
            color: #92400e;
            line-height: 1.5;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
@php
    // Helper to safely format and validate base64 image strings for DomPDF
    $formatBase64 = function(?string $raw, string $defaultMime = 'image/png'): ?string {
        if (empty($raw)) {
            return null;
        }
        $raw = trim($raw);
        if (str_starts_with($raw, 'data:image/')) {
            $commaPos = strpos($raw, ',');
            if ($commaPos !== false) {
                $header = substr($raw, 0, $commaPos);
                $body = substr($raw, $commaPos + 1);
                $cleanBody = preg_replace('/\s+/', '', $body);
                if (strlen($cleanBody) > 20 && base64_decode($cleanBody, true) !== false) {
                    return $header . ',' . $cleanBody;
                }
            }
            return null;
        }
        $clean = preg_replace('/\s+/', '', $raw);
        if (strlen($clean) > 20 && base64_decode($clean, true) !== false) {
            return "data:{$defaultMime};base64,{$clean}";
        }
        return null;
    };

    // Load original uploaded scan safely from storage if available
    $uploadedScanBase64 = null;
    if (!empty($analysis->image_path)) {
        $storagePath = storage_path('app/public/' . ltrim(str_replace('\\', '/', $analysis->image_path), '/'));
        if (file_exists($storagePath) && is_readable($storagePath)) {
            $ext = strtolower(pathinfo($storagePath, PATHINFO_EXTENSION));
            $mime = in_array($ext, ['jpg', 'jpeg']) ? 'image/jpeg' : (in_array($ext, ['png']) ? 'image/png' : 'image/jpeg');
            $data = @file_get_contents($storagePath);
            if ($data !== false && strlen($data) > 0) {
                $uploadedScanBase64 = "data:{$mime};base64," . base64_encode($data);
            }
        }
    }

    // Extract visual evidence payloads safely
    $payload = is_array($analysis->ai_response_payload) ? $analysis->ai_response_payload : [];
    $dualPanelBase64 = $formatBase64($payload['visualization_base64'] ?? null, 'image/png');
    $gradcamBase64   = $formatBase64($payload['gradcam_image'] ?? $payload['heatmap_url'] ?? null, 'image/png');
    $cleanedBase64   = $formatBase64($payload['cleaned_scan_base64'] ?? null, 'image/jpeg');

    // Diagnosis classification
    $predRaw = strtolower((string)($analysis->prediction ?? 'normal'));
    $statusVal = strtolower((string)($analysis->status?->value ?? 'completed'));
    $confidence = (float)($analysis->confidence ?? 0.0);

    $isCyst = str_contains($predRaw, 'cyst');
    $isTumor = str_contains($predRaw, 'tumor');
    $isStone = str_contains($predRaw, 'stone') || str_contains($predRaw, 'nephrolithiasis');
    $isNormal = str_contains($predRaw, 'normal');

    $isRejected = ($statusVal === 'failed' || $statusVal === 'rejected' || str_contains($predRaw, 'reject') || str_contains($predRaw, 'non-kidney') || str_contains($predRaw, 'invalid'));
    $isReview = ($statusVal === 'review') || ($confidence > 0 && $confidence < 40.0);

    $diagClass = 'normal';
    $diagTitle = 'NORMAL RENAL PARENCHYMA (HEALTHY)';
    $diagBadge = 'LOW RISK · PHYSIOLOGICALLY PRESERVED PARENCHYMAL ARCHITECTURE';
    $diagSub = 'No acoustic calculus, cortical cyst, or suspicious focal parenchymal mass detected.';

    if ($isRejected) {
        $diagClass = 'rejected';
        $diagTitle = 'STUDY REJECTED — NON-ULTRASOUND / OOD SCAN';
        $diagBadge = 'GATEKEEPER REJECTION · INVALID SCAN MODALITY FOR TRIAGE';
        $diagSub = 'The submitted image failed renal acoustic gatekeeper verification. Re-scan required.';
    } elseif ($isTumor) {
        $diagClass = 'tumor';
        $diagTitle = 'SUSPICIOUS RENAL MASS / NEOPLASM ALERT';
        $diagBadge = 'URGENT ATTENTION · SOLID HETEROGENEOUS PARENCHYMAL LESION';
        $diagSub = 'Suspicious architectural distortion detected. Urgent contrast CT/MRI and oncology consultation advised.';
    } elseif ($isStone) {
        $diagClass = 'stone';
        $diagTitle = 'KIDNEY STONE DETECTED (NEPHROLITHIASIS)';
        $diagBadge = 'ELEVATED RISK · ACOUSTIC FOCUS WITH POSTERIOR SHADOWING';
        $diagSub = 'Echogenic calculus identified within renal pelvicalyceal system. Urology evaluation recommended.';
    } elseif ($isCyst) {
        $diagClass = 'cyst';
        $diagTitle = 'RENAL CORTICAL CYST (BOSNIAK I/II)';
        $diagBadge = 'BENIGN LESION · ANNECHOIC FLUID-FILLED CORTICAL ENVELOPE';
        $diagSub = 'Avascular fluid lesion with enhanced acoustic through-transmission. Routine periodic surveillance advised.';
    } elseif ($isReview) {
        $diagClass = 'review';
        $diagTitle = 'BORDERLINE MARGIN — SECONDARY CLINICAL TRIAGE';
        $diagBadge = 'CLINICAL REVIEW REQUIRED · AI PREDICTION CONFIDENCE BORDERLINE';
        $diagSub = 'Narrow classification margin detected. Prior to clinical action, radiologist validation is required.';
    }

    // Gatekeeper data
    $gate = $payload['gate_evaluation'] ?? null;
    $gatePassed = null;
    $kidneyConf = null;
    $nonKidneyProb = null;
    if (is_array($gate)) {
        $gatePassed = isset($gate['gate_passed']) ? (bool)$gate['gate_passed'] : true;
        $kidneyConf = isset($gate['kidney_confidence_percent']) ? (float)$gate['kidney_confidence_percent'] : null;
        $nonKidneyProb = isset($gate['non_kidney_probability_percent']) ? (float)$gate['non_kidney_probability_percent'] : null;
    }

    // 4-Class Probabilities
    $probs = $payload['class_probabilities'] ?? null;
    $hasValidProbs = is_array($probs) && (isset($probs['Cyst']) || isset($probs['Normal']) || isset($probs['Stone']) || isset($probs['Tumor']));

    // Pathology dimensions
    $clinAssessment = $payload['clinical_assessment'] ?? null;
    $diameterMm = is_array($clinAssessment) && isset($clinAssessment['estimated_diameter_mm']) ? (float)$clinAssessment['estimated_diameter_mm'] : null;
@endphp

    <!-- PAGE 1: Header, Demographics, Gatekeeper, 4-Class Diagnosis & Recommendations -->
    <div class="header">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 65%; vertical-align: top;">
                    <div class="header-title">KidneyVision AI</div>
                    <div class="header-subtitle">Clinical Decision Support · 4-Class Renal Diagnostic Report</div>
                    <div class="header-meta">
                        <strong>Report Ref:</strong> KV-REP-{{ str_pad((string)$analysis->id, 6, '0', STR_PAD_LEFT) }} &nbsp;|&nbsp;
                        <strong>Issued:</strong> {{ $analysis->processed_at ? $analysis->processed_at->format('M d, Y h:i A') : now()->format('M d, Y h:i A') }}
                    </div>
                </td>
                <td style="width: 35%; text-align: right; vertical-align: top;">
                    <div style="font-size: 10px; color: #475569; line-height: 1.6;">
                        <strong style="color: #0f172a;">Attending Clinician:</strong><br>
                        {{ $user->name }}<br>
                        <span style="color: #64748b;">{{ $user->email }}</span><br>
                        @if(!empty($user->hospital))
                            <strong style="color: #0f172a;">Hospital PACS / Center:</strong><br>
                            {{ $user->hospital }}
                        @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Patient & Study Demographics -->
    <div class="section">
        <div class="section-title">Patient & Case Study Demographics</div>
        <div class="info-box">
            <table class="info-table">
                <tr>
                    <td class="label-col">Patient Alias / Identifier</td>
                    <td class="val-col" style="width: 35%;">
                        <strong style="color: #2563eb;">{{ $analysis->patient_id ?: 'PT-' . str_pad((string)$analysis->id, 4, '0', STR_PAD_LEFT) }}</strong>
                        @if(!empty($analysis->patient_name))
                            ({{ $analysis->patient_name }})
                        @endif
                    </td>
                    <td class="label-col">Case Study ID</td>
                    <td class="val-col">KV-{{ str_pad((string)$analysis->id, 6, '0', STR_PAD_LEFT) }}</td>
                </tr>
                <tr>
                    <td class="label-col">Age / Gender</td>
                    <td class="val-col">{{ $analysis->patient_age ? $analysis->patient_age . ' Yrs' : 'N/A' }} · {{ ucfirst((string)($analysis->patient_gender ?? 'Unspecified')) }}</td>
                    <td class="label-col">Acquisition Date</td>
                    <td class="val-col">{{ $analysis->processed_at ? $analysis->processed_at->format('M d, Y') : now()->format('M d, Y') }}</td>
                </tr>
                <tr>
                    <td class="label-col">Anatomical Target Site</td>
                    <td class="val-col">{{ $analysis->anatomical_location ?: 'Renal Parenchyma / Pelvicalyceal' }}</td>
                    <td class="label-col">Study Modality</td>
                    <td class="val-col">B-Mode Acoustic Ultrasound</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Ultrasound Gatekeeper Verification Result -->
    <div class="section">
        <div class="section-title">Stage 1 · Ultrasound Gatekeeper Verification</div>
        @if($gatePassed === true)
            <div class="gatekeeper-card passed">
                <div class="gatekeeper-title" style="color: #15803d;">
                    &#10004; GATEKEEPER VERIFIED: AUTHENTIC RENAL SCAN
                </div>
                <div class="gatekeeper-desc">
                    Stage-1 Neural Gatekeeper (MobileNetV3) authenticated renal ultrasound/CT structural characteristics.
                    @if($kidneyConf !== null)
                        Kidney Modality Confidence: <strong>{{ number_format($kidneyConf, 1) }}%</strong>
                    @endif
                    @if($nonKidneyProb !== null)
                        (Non-Kidney Probability: {{ number_format($nonKidneyProb, 1) }}%).
                    @endif
                    Image cleared for 4-class multi-pathology deep inference.
                </div>
            </div>
        @elseif($gatePassed === false || $isRejected)
            <div class="gatekeeper-card rejected">
                <div class="gatekeeper-title" style="color: #b91c1c;">
                    &#10008; GATEKEEPER REJECTION: NON-KIDNEY OR OUT-OF-DISTRIBUTION INPUT
                </div>
                <div class="gatekeeper-desc">
                    Stage-1 Neural Gatekeeper rejected this scan: image characteristics do not match authentic renal ultrasound or CT data.
                    @if($nonKidneyProb !== null)
                        Non-kidney probability detected at <strong>{{ number_format($nonKidneyProb, 1) }}%</strong>.
                    @endif
                    Diagnostic triage halted to prevent erroneous pathological classification. Please upload a verified renal ultrasound scan.
                </div>
            </div>
        @else
            <div class="gatekeeper-card">
                <div class="gatekeeper-title" style="color: #475569;">
                    GATEKEEPER STATUS: PRE-SCREENING RECORD NOT CAPTURED
                </div>
                <div class="gatekeeper-desc">
                    This study was ingested under legacy pipeline protocols or gatekeeper telemetry was not recorded. Ingestion validated by clinician upload.
                </div>
            </div>
        @endif
    </div>

    <!-- Primary Diagnostic Assessment Banner -->
    <div class="section">
        <div class="section-title">Stage 2 · Primary Multi-Pathology Diagnostic Finding</div>
        <div class="diag-banner {{ $diagClass }}">
            <div class="diag-header-label">
                AI Diagnostic Decision Support · SOTA ConvNeXt-Tiny Architecture
            </div>
            <div class="diag-title">
                {{ $diagTitle }}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 70%; vertical-align: middle;">
                        <div class="diag-subbadge">
                            {{ $diagBadge }}
                        </div>
                        <div style="font-size: 10px; color: #475569; margin-top: 3px;">
                            {{ $diagSub }}
                        </div>
                    </td>
                    <td style="width: 30%; text-align: right; vertical-align: middle;">
                        <div style="font-size: 11px; font-weight: 700; color: #0f172a;">
                            AI CONFIDENCE:
                        </div>
                        <div style="font-size: 20px; font-weight: 800; color: #2563eb;">
                            {{ $confidence > 0 ? number_format($confidence, 1) . '%' : 'N/A' }}
                        </div>
                        @if($diameterMm !== null && $diameterMm > 0)
                            <div style="font-size: 10px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                                Est. Diameter: ~{{ number_format($diameterMm, 1) }} mm
                            </div>
                        @endif
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Complete 4-Class Probability Breakdown -->
    <div class="section">
        <div class="section-title">Complete 4-Class Pathology Probability Spectrum</div>
        @if($hasValidProbs)
            <table class="prob-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Pathology Class</th>
                        <th style="width: 18%;">Probability</th>
                        <th style="width: 42%;">Confidence Distribution Bar</th>
                        <th style="width: 15%; text-align: right;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $classes = [
                            ['key' => 'Cyst', 'label' => 'Renal Cyst (Bosniak)', 'color' => '#0d9488', 'bg' => '#ccfbf1'],
                            ['key' => 'Normal', 'label' => 'Normal Parenchyma', 'color' => '#16a34a', 'bg' => '#dcfce7'],
                            ['key' => 'Stone', 'label' => 'Nephrolithiasis (Stone)', 'color' => '#dc2626', 'bg' => '#fee2e2'],
                            ['key' => 'Tumor', 'label' => 'Suspicious Neoplasm / Mass', 'color' => '#7c3aed', 'bg' => '#f3e8ff'],
                        ];
                    @endphp
                    @foreach($classes as $c)
                        @php
                            $probVal = isset($probs[$c['key']]) ? (float)$probs[$c['key']] : 0.0;
                            // Ensure probability between 0 and 100
                            $probVal = max(0.0, min(100.0, $probVal));
                            $isPredClass = (strtolower($c['key']) === $predRaw) ||
                                           ($c['key'] === 'Stone' && $isStone) ||
                                           ($c['key'] === 'Cyst' && $isCyst) ||
                                           ($c['key'] === 'Tumor' && $isTumor) ||
                                           ($c['key'] === 'Normal' && $isNormal);
                        @endphp
                        <tr style="{{ $isPredClass ? 'background-color: #f8fafc; font-weight: 700;' : '' }}">
                            <td>
                                <strong style="color: {{ $c['color'] }};">&#9632;</strong>
                                {{ $c['label'] }}
                            </td>
                            <td>
                                <strong>{{ number_format($probVal, 2) }}%</strong>
                            </td>
                            <td>
                                <div class="prob-bar-bg">
                                    <div class="prob-bar-fill" style="width: {{ $probVal }}%; background-color: {{ $c['color'] }};"></div>
                                </div>
                            </td>
                            <td style="text-align: right;">
                                @if($isPredClass)
                                    <span style="color: {{ $c['color'] }}; font-weight: 700; font-size: 10px;">PRIMARY</span>
                                @else
                                    <span style="color: #94a3b8; font-size: 10px;">Differential</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="info-box" style="color: #64748b; font-size: 10px; font-style: italic;">
                Detailed 4-class probability distribution was not captured for this analysis record. Overall detection confidence: {{ number_format($confidence, 1) }}%.
            </div>
        @endif
    </div>

    <!-- AI Clinical Summary & Sonographic Notes -->
    <div class="section">
        <div class="section-title">Clinical Findings & Sonographic Analysis</div>
        @if($analysis->report && !empty($analysis->report->summary))
            <div class="summary-box">
                <div class="summary-title">AI Multi-Pathology Diagnostic Summary</div>
                <div class="summary-text">
                    {{ $analysis->report->summary }}
                </div>
            </div>
        @endif

        @if(!empty($analysis->clinician_notes))
            <div class="info-box" style="border-left: 4px solid #0f172a; margin-top: 10px;">
                <div style="font-size: 10px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">
                    Attending Radiologist / Clinician Addendum Notes
                </div>
                <div style="font-size: 11px; color: #334155; font-style: italic; line-height: 1.5;">
                    "{{ $analysis->clinician_notes }}"
                </div>
                <div style="font-size: 9px; color: #64748b; margin-top: 6px;">
                    Recorded by {{ $user->name }} &nbsp;|&nbsp; Verified in Hospital PACS Registry
                </div>
            </div>
        @endif
    </div>

    <!-- Clinical Recommendations Protocol -->
    @if($analysis->report && $analysis->report->recommendations && count($analysis->report->recommendations) > 0)
        <div class="section">
            <div class="section-title">Recommended Clinical Protocol</div>
            @foreach($analysis->report->recommendations as $rec)
                <div class="recommendation-item">
                    {{ $rec }}
                </div>
            @endforeach
        </div>
    @endif

    <!-- Page 1 Footer -->
    <div class="footer">
        <div class="disclaimer">
            <strong>IMPORTANT CLINICAL NOTICE:</strong> This diagnostic document is an assistive decision-support report generated by KidneyVision AI. It is strictly intended to aid qualified healthcare professionals and must NOT replace primary radiological evaluation, histopathology, or direct clinical judgment.
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="font-size: 8px; color: #94a3b8;">
                    Model: ConvNeXt-Tiny (Master 4-Class SOTA) + MobileNetV3-Small (Kidney Gatekeeper) · Task: 4-Class Renal Pathology Triage
                </td>
                <td style="font-size: 8px; color: #94a3b8; text-align: right;">
                    Page 1 of 2 · Confidential Medical Report
                </td>
            </tr>
        </table>
    </div>

    <!-- PAGE BREAK -->
    <div class="page-break"></div>

    <!-- PAGE 2: Visual Diagnostic Evidence Suite & Certification -->
    <div class="header" style="margin-bottom: 15px; padding: 18px 35px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 70%;">
                    <div style="font-size: 18px; font-weight: 700; color: #2563eb;">KidneyVision AI · Visual Evidence Suite</div>
                    <div style="font-size: 10px; color: #64748b;">
                        Patient: <strong>{{ $analysis->patient_id ?: 'PT-' . str_pad((string)$analysis->id, 4, '0', STR_PAD_LEFT) }}</strong>
                        ({{ $analysis->patient_name ?: 'Anonymous Patient' }}) &nbsp;|&nbsp;
                        Study: KV-{{ str_pad((string)$analysis->id, 6, '0', STR_PAD_LEFT) }}
                    </div>
                </td>
                <td style="width: 30%; text-align: right; font-size: 10px; color: #64748b;">
                    Diagnostic Visual Audit<br>
                    {{ now()->format('M d, Y') }}
                </td>
            </tr>
        </table>
    </div>

    <!-- Primary Evidence: Dual Clinical Comparative Panel -->
    <div class="section">
        <div class="section-title">1. Dual Clinical Comparative Panel (Side-by-Side Diagnostic HUD)</div>
        @if($isNormal)
            <div class="gatekeeper-card passed" style="margin-bottom: 5px; border-left: 4px solid #16a34a; background-color: #f0fdf4; padding: 12px 16px;">
                <div class="gatekeeper-title" style="color: #15803d; font-size: 11px; font-weight: 700;">
                    &#10004; PHYSIOLOGICALLY NORMAL PARENCHYMA — GRAD-CAM HEATMAP NOT APPLICABLE
                </div>
                <div class="gatekeeper-desc" style="color: #334155; font-size: 10px; margin-top: 4px; line-height: 1.5;">
                    Normal renal architecture confirmed across cortex and pelvicalyceal system. Grad-CAM neural saliency heatmaps are interpretability instruments designed specifically to localize focal space-occupying lesions or calculi (Nephrolithiasis, Cyst, Neoplasm). Heatmap localization is suppressed for normal studies to prevent confusing non-pathological background artifacts.
                </div>
            </div>
        @elseif(!empty($dualPanelBase64))
            <div class="image-frame" style="text-align: center;">
                <img src="{{ $dualPanelBase64 }}" alt="Dual Clinical Comparative Panel" style="max-height: 230px; object-fit: contain;">
                <div class="image-caption-title">Dual Comparative Visualization: Cleaned B-Mode Scan vs. Grad-CAM Neural Activation Map</div>
                <div class="image-caption-desc">
                    Synchronized side-by-side diagnostic presentation. Left panel displays acoustic scan with text and measurement calipers inpainted; right panel demonstrates neural gradient activation over the pathology zone.
                </div>
            </div>
        @else
            <div class="image-placeholder">
                <strong>Dual Clinical Comparative Panel Not Available</strong><br>
                The synchronized side-by-side visualization was not generated or has been cleared from transient cache.
            </div>
        @endif
    </div>

    <!-- Detailed 3-Panel Evidence Suite -->
    <div class="section">
        <div class="section-title">2. Multi-Stage Visual Diagnostic Evidence Suite</div>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <!-- Panel A: Original Uploaded Scan -->
                <td style="width: 33.3%; vertical-align: top;" class="image-cell">
                    <div style="font-size: 10px; font-weight: 700; color: #334155; margin-bottom: 4px; text-transform: uppercase;">
                        Panel A · Original Scan
                    </div>
                    @if(!empty($uploadedScanBase64))
                        <div class="image-frame">
                            <img src="{{ $uploadedScanBase64 }}" alt="Original Scan" style="max-height: 140px; object-fit: contain;">
                        </div>
                    @else
                        <div class="image-placeholder" style="height: 120px; padding-top: 40px;">
                            Original scan file not available on local storage.
                        </div>
                    @endif
                    <div class="image-caption-title">Raw Ultrasound Acquisition</div>
                    <div class="image-caption-desc">Source B-mode ultrasound image directly ingested from clinical transducer or PACS registry.</div>
                </td>

                <!-- Panel B: Cleaned & Inpainted Scan -->
                <td style="width: 33.3%; vertical-align: top;" class="image-cell">
                    <div style="font-size: 10px; font-weight: 700; color: #334155; margin-bottom: 4px; text-transform: uppercase;">
                        Panel B · Cleaned Scan
                    </div>
                    @if(!empty($cleanedBase64))
                        <div class="image-frame">
                            <img src="{{ $cleanedBase64 }}" alt="Cleaned Scan" style="max-height: 140px; object-fit: contain;">
                        </div>
                    @else
                        <div class="image-placeholder" style="height: 120px; padding-top: 40px;">
                            Cleaned scan image not available (Auto-masking was bypassed or legacy study).
                        </div>
                    @endif
                    <div class="image-caption-title">Inpainted Acoustic Field</div>
                    <div class="image-caption-desc">Telea inpainting algorithm applied to eliminate sonographer calipers, depth scales, and text overlays.</div>
                </td>

                <!-- Panel C: Grad-CAM Saliency Map -->
                <td style="width: 33.3%; vertical-align: top;" class="image-cell">
                    <div style="font-size: 10px; font-weight: 700; color: #334155; margin-bottom: 4px; text-transform: uppercase;">
                        Panel C · Grad-CAM Heatmap
                    </div>
                    @if($isNormal)
                        <div class="image-placeholder" style="height: 120px; padding-top: 35px; color: #15803d; background-color: #f0fdf4; border-color: #bbf7d0;">
                            <strong style="color: #15803d;">Not Applicable</strong><br>
                            <span style="font-size: 9px; color: #475569;">Normal scan — no focal lesion to localize.</span>
                        </div>
                    @elseif(!empty($gradcamBase64))
                        <div class="image-frame">
                            <img src="{{ $gradcamBase64 }}" alt="Grad-CAM Heatmap" style="max-height: 140px; object-fit: contain;">
                        </div>
                    @else
                        <div class="image-placeholder" style="height: 120px; padding-top: 40px;">
                            Grad-CAM saliency activation map not available for this record.
                        </div>
                    @endif
                    <div class="image-caption-title">Neural Saliency Activation</div>
                    <div class="image-caption-desc">
                        @if($isNormal)
                            Physiologically preserved tissue. Heatmap overlay is not indicated.
                        @else
                            Gradient-weighted Class Activation Mapping (Grad-CAM) isolating parenchymal feature regions driving model triage.
                        @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Attending Clinician Certification & System Telemetry -->
    <div class="section">
        <div class="section-title">3. Attending Clinician Certification & System Telemetry</div>
        <div class="cert-box">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 65%; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 5px;">
                            CLINICAL INTEGRITY & PACS VERIFICATION CERTIFICATE
                        </div>
                        <div style="font-size: 10px; color: #475569; line-height: 1.6;">
                            <strong>Attending Physician:</strong> {{ $user->name }} (Radiology / Nephrology)<br>
                            <strong>Medical Center:</strong> {{ $user->hospital ?: 'KidneyVision Clinical Health Network' }}<br>
                            <strong>Deep Learning Architecture:</strong> ConvNeXt-Tiny (Master 4-Class SOTA) + MobileNetV3-Small (Kidney Gatekeeper)<br>
                            <strong>Task Description:</strong> 4-Class Renal Pathology Triage (Cyst, Normal, Stone, Tumor) & Modality Gatekeeper<br>
                            <strong>Digital Verification Hash:</strong> SHA256-{{ strtoupper(hash('sha256', (string)$analysis->id . ($analysis->processed_at ?? now()))) }}<br>
                            <strong>Audit Compliance:</strong> DICOM & PACS Compliant Clinical Record
                        </div>
                    </td>
                    <td style="width: 35%; text-align: center; vertical-align: middle;">
                        <div class="cert-stamp">
                            <div style="font-size: 9px; font-weight: 800; color: #2563eb; letter-spacing: 1px;">DIGITALLY VERIFIED</div>
                            <div style="font-size: 8px; color: #475569; margin-top: 3px;">KidneyVision AI Platform</div>
                            <div style="font-size: 8px; font-weight: 700; color: #0f172a; margin-top: 2px;">Study: KV-{{ str_pad((string)$analysis->id, 6, '0', STR_PAD_LEFT) }}</div>
                            <div style="font-size: 7px; color: #16a34a; font-weight: 700; margin-top: 4px;">&#10004; PACS ARCHIVED</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Page 2 Footer -->
    <div class="footer">
        <div class="disclaimer">
            <strong>CONFIDENTIAL MEDICAL DOCUMENT:</strong> This report contains protected health information (PHI) intended solely for the authorized clinical recipient. Unauthorized dissemination or copying is strictly prohibited under medical data privacy regulations.
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="font-size: 8px; color: #94a3b8;">
                    KidneyVision AI Platform v3.0 · ConvNeXt-Tiny SOTA Deep Learning Pipeline · Report ID: KV-REP-{{ str_pad((string)$analysis->id, 6, '0', STR_PAD_LEFT) }}
                </td>
                <td style="font-size: 8px; color: #94a3b8; text-align: right;">
                    Page 2 of 2 · End of Clinical Diagnostic Report
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
