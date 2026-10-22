<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>KidneyVision AI — Patient Longitudinal History ({{ $patient->patient_id }})</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 12mm 15mm 12mm 15mm;
        }

        body {
            font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            font-size: 8.5pt;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .header-brand {
            font-size: 18pt;
            font-weight: bold;
            color: #1e3a8a;
            letter-spacing: -0.5px;
        }

        .header-brand span {
            color: #2563eb;
        }

        .header-title {
            text-align: right;
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .header-sub {
            text-align: right;
            font-size: 8pt;
            color: #64748b;
            margin-top: 1px;
        }

        .demographics-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1.5px solid #2563eb;
            border-bottom: 1.5px solid #cbd5e1;
            background-color: #f8fafc;
            margin-top: 6px;
            margin-bottom: 10px;
        }

        .demographics-table td {
            padding: 4px 6px;
            vertical-align: middle;
            font-size: 8pt;
        }

        .demo-label {
            color: #64748b;
            font-weight: bold;
            width: 16%;
        }

        .demo-val {
            color: #0f172a;
            font-weight: bold;
            width: 34%;
        }

        .section-header {
            font-size: 9pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-top: 10px;
            margin-bottom: 4px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 2px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 8px;
            font-size: 7.5pt;
        }

        .data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            text-align: left;
            padding: 4px 5px;
            border-bottom: 1px solid #cbd5e1;
        }

        .data-table td {
            padding: 4px 5px;
            border-bottom: 0.5px solid #e2e8f0;
            vertical-align: middle;
        }

        .badge {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 7pt;
            text-transform: uppercase;
        }

        .badge-stone { background-color: #fee2e2; color: #991b1b; }
        .badge-cyst { background-color: #ccfbf1; color: #115e59; }
        .badge-tumor { background-color: #f3e8ff; color: #6b21a8; }
        .badge-normal { background-color: #dcfce7; color: #166534; }
        .badge-pending { background-color: #fef3c7; color: #92400e; }
        .badge-completed { background-color: #e0e7ff; color: #3730a3; }

        .signature-box {
            margin-top: 14px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            width: 100%;
        }

        .footer {
            margin-top: 12px;
            font-size: 6.5pt;
            color: #94a3b8;
            text-align: center;
            border-top: 0.5px solid #e2e8f0;
            padding-top: 4px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 50%;">
                <div class="header-brand">KidneyVision <span>AI</span></div>
                <div style="font-size: 7.5pt; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
                    Department of Nephrology &amp; Diagnostic Urology
                </div>
            </td>
            <td style="width: 50%;">
                <div class="header-title">Patient Longitudinal History</div>
                <div class="header-sub">Document Ref: KV-HIST-{{ $patient->patient_id }}</div>
                <div class="header-sub">Generated: {{ now()->format('M d, Y - H:i T') }}</div>
            </td>
        </tr>
    </table>

    <!-- Patient Demographics -->
    <table class="demographics-table">
        <tr>
            <td class="demo-label">Patient Name:</td>
            <td class="demo-val">{{ $patient->name }}</td>
            <td class="demo-label">Patient ID:</td>
            <td class="demo-val" style="color: #2563eb;">{{ $patient->patient_id }}</td>
        </tr>
        <tr>
            <td class="demo-label">Age / Gender:</td>
            <td class="demo-val">{{ $patient->age ? $patient->age . ' yrs' : 'Not recorded' }} / {{ $patient->gender ?: 'Unspecified' }}</td>
            <td class="demo-label">Contact:</td>
            <td class="demo-val">{{ $patient->phone ?: ($patient->email ?: 'None on file') }}</td>
        </tr>
        <tr>
            <td class="demo-label">First Exam:</td>
            <td class="demo-val">{{ $firstVisit ? $firstVisit->format('M d, Y') : 'N/A' }}</td>
            <td class="demo-label">Latest Exam:</td>
            <td class="demo-val">{{ $lastVisit ? $lastVisit->format('M d, Y') : 'N/A' }}</td>
        </tr>
        <tr>
            <td class="demo-label">Total Analyses:</td>
            <td class="demo-val">{{ $analyses->count() }} Diagnostic Studies</td>
            <td class="demo-label">Attending Clinician:</td>
            <td class="demo-val">{{ $user->name ?? 'Dr. Specialist' }} (MD)</td>
        </tr>
    </table>

    @if($patient->notes)
    <div style="background-color: #f1f5f9; border-left: 3px solid #2563eb; padding: 5px 8px; font-size: 7.5pt; margin-bottom: 8px;">
        <strong>Clinical Baseline Notes:</strong> {{ $patient->notes }}
    </div>
    @endif

    <!-- Section 1: Imaging History -->
    <div class="section-header">1. Diagnostic Imaging &amp; AI Evaluation History ({{ $analyses->count() }} Scans)</div>
    @if($analyses->isEmpty())
        <p style="font-size: 7.5pt; color: #64748b;">No imaging analyses recorded for this patient.</p>
    @else
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 14%;">Date / Time</th>
                    <th style="width: 14%;">Study Code</th>
                    <th style="width: 16%;">Location</th>
                    <th style="width: 20%;">AI Classification</th>
                    <th style="width: 12%;">Confidence</th>
                    <th style="width: 12%;">Review Status</th>
                    <th style="width: 12%;">Report</th>
                </tr>
            </thead>
            <tbody>
                @foreach($analyses as $scan)
                <tr>
                    <td>{{ $scan->created_at->format('M d, Y H:i') }}</td>
                    <td style="font-family: monospace; font-weight: bold; color: #2563eb;">KV-{{ str_pad((string)$scan->id, 6, '0', STR_PAD_LEFT) }}</td>
                    <td>{{ $scan->anatomical_location ?: 'Renal Scan' }}</td>
                    <td>
                        @php
                            $finding = strtolower($scan->prediction ?? '');
                            $cls = match(true) {
                                str_contains($finding, 'stone') => 'badge-stone',
                                str_contains($finding, 'cyst') => 'badge-cyst',
                                str_contains($finding, 'tumor') => 'badge-tumor',
                                default => 'badge-normal',
                            };
                        @endphp
                        <span class="badge {{ $cls }}">{{ $scan->prediction ?: 'Normal' }}</span>
                    </td>
                    <td>{{ number_format((float)$scan->confidence, 1) }}%</td>
                    <td>
                        <span style="text-transform: capitalize; font-weight: bold;">{{ $scan->status->value }}</span>
                    </td>
                    <td>
                        {{ $scan->report ? 'Generated' : 'None' }}
                    </td>
                </tr>
                @if($scan->clinician_notes)
                <tr>
                    <td colspan="7" style="background-color: #fafafa; padding-left: 15px; color: #475569; font-style: italic;">
                        <strong>Note:</strong> {{ $scan->clinician_notes }}
                    </td>
                </tr>
                @endif
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- Section 2: Clinical Follow-ups -->
    <div class="section-header" style="margin-top: 12px;">2. Scheduled &amp; Completed Clinical Follow-ups ({{ $followUps->count() }} Visits)</div>
    @if($followUps->isEmpty())
        <p style="font-size: 7.5pt; color: #64748b;">No follow-up visits currently scheduled for this patient.</p>
    @else
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 18%;">Follow-up Date</th>
                    <th style="width: 25%;">Reason / Clinical Objective</th>
                    <th style="width: 15%;">Status</th>
                    <th style="width: 42%;">Progress &amp; Consultation Notes</th>
                </tr>
            </thead>
            <tbody>
                @foreach($followUps as $fu)
                <tr>
                    <td style="font-weight: bold;">{{ $fu->follow_up_date->format('M d, Y - H:i') }}</td>
                    <td>{{ $fu->reason }}</td>
                    <td>
                        <span class="badge {{ $fu->status === 'completed' ? 'badge-completed' : ($fu->isOverdue() ? 'badge-stone' : 'badge-pending') }}">
                            {{ ucfirst($fu->status) }}{{ $fu->isOverdue() ? ' (Overdue)' : '' }}
                        </span>
                    </td>
                    <td>{{ $fu->clinical_notes ?: '—' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- Clinician Certification & Signature -->
    <table class="signature-box">
        <tr>
            <td style="width: 60%; vertical-align: top; font-size: 7pt; color: #64748b;">
                <strong>Clinical Certification Notice:</strong><br>
                This longitudinal history report was extracted directly from the authenticated KidneyVision AI clinical database.
                All algorithmic classifications represent deep convolutional neural network triage assessments and are retained
                for clinical audit and comparative monitoring.
            </td>
                @if(!empty($signatureBase64))
                    <img src="{{ $signatureBase64 }}" style="max-height: 42px; margin-bottom: 3px;" alt="Signature"><br>
                @else
                    <div style="display: inline-block; border: 1px dashed #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 7pt; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">
                        [ PENDING CLINICIAN ATTESTATION / UNSIGNED DRAFT ]
                    </div><br>
                @endif
                <div style="font-size: 7pt; color: #64748b;">{{ $user->specialty ?? 'Department of Urology / Nephrology' }}</div>
            </td>
        </tr>
    </table>

    <!-- Footer -->
    <div class="footer">
        KidneyVision AI Platform &bull; Patient ID: {{ $patient->patient_id }} &bull; Confirmed Confidential Medical Record &bull; Page 1 of 1
    </div>

</body>
</html>
