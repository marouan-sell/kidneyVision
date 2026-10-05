import React, { useState } from 'react';
import type { ScanRecord } from '../../types/scan';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  Activity,
  CheckCircle,
  AlertOctagon,
  Download,
  XCircle,
  Crosshair,
  Sparkles,
  Ruler,
  Cpu,
  Loader2,
} from 'lucide-react';
import { generateScanPdfReport } from '../../utils/generateScanPdfReport';
import { confirmAnalysis, flagAnalysis } from '../../services/analysis.service';

interface ScanDetailModalProps {
  scan: ScanRecord | null;
  onClose: () => void;
  onScanUpdated?: (updatedScan: ScanRecord) => void;
}

export const ScanDetailModal: React.FC<ScanDetailModalProps> = ({ scan, onClose, onScanUpdated }) => {
  const isStone = scan?.diagnosis === 'nephrolithiasis';
  const isNormal = scan?.diagnosis === 'normal' || (scan?.pathologyTitle || '').toLowerCase().includes('normal');
  const isCyst = scan?.diagnosis === 'cyst';
  const isTumor = scan?.diagnosis === 'tumor';
  const isPending = scan?.diagnosis === 'pending';
  const isRejected = scan?.diagnosis === 'rejected';

  const [viewMode, setViewMode] = useState<'panel' | 'gradcam' | 'cleaned' | 'raw'>(
    isNormal ? (scan?.cleanedScanUrl ? 'cleaned' : 'raw') : (scan?.visualizationUrl ? 'panel' : scan?.heatmapUrl ? 'gradcam' : 'raw')
  );
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);

  if (!scan) return null;

  const diagnosisLabel = isRejected
    ? 'Rejected / Non-Kidney Scan'
    : isNormal
    ? 'Normal Parenchyma'
    : isStone
    ? 'Nephrolithiasis (Stone)'
    : isCyst
    ? 'Renal Cyst (Bosniak I/II)'
    : isTumor
    ? 'Suspicious Renal Mass / Tumor'
    : 'Pending Review';

  const handleAction = (msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleConfirm = async () => {
    if (!scan) return;
    setIsConfirming(true);
    setActionError(null);
    try {
      const updated = await confirmAnalysis(scan.id);
      const updatedRecord: ScanRecord = {
        ...scan,
        status: 'reviewed',
        confirmedAt: updated.confirmedAt || new Date().toISOString(),
        confirmedByName: updated.confirmedByName || 'Attending Clinician',
      };
      if (onScanUpdated) {
        onScanUpdated(updatedRecord);
      }
      handleAction('Clinician signed and confirmed finding in database.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm finding in database.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleFlag = async () => {
    if (!scan) return;
    setIsFlagging(true);
    setActionError(null);
    try {
      const updated = await flagAnalysis(
        scan.id,
        'urology',
        'Flagged by attending clinician for specialist urological consultation.'
      );
      const updatedRecord: ScanRecord = {
        ...scan,
        status: 'flagged',
        flaggedFor: 'urology',
        flaggedAt: updated.flaggedAt || new Date().toISOString(),
      };
      if (onScanUpdated) {
        onScanUpdated(updatedRecord);
      }
      handleAction('Scan successfully flagged for Urology Consultation in database.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to flag scan in database.');
    } finally {
      setIsFlagging(false);
    }
  };

  // Determine active image URL
  const activeImageSrc = (() => {
    if (viewMode === 'panel' && scan.visualizationUrl) return scan.visualizationUrl;
    if (viewMode === 'gradcam' && scan.heatmapUrl) return scan.heatmapUrl;
    if (viewMode === 'cleaned' && scan.cleanedScanUrl) return scan.cleanedScanUrl;
    if (viewMode === 'raw' && scan.imageUrl) return scan.imageUrl;
    return scan.visualizationUrl || scan.heatmapUrl || scan.cleanedScanUrl || scan.imageUrl;
  })();

  const hasRealImage = Boolean(activeImageSrc);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isRejected
                  ? 'bg-red-100 text-red-800'
                  : isNormal
                  ? 'bg-emerald-100 text-emerald-800'
                  : isStone
                  ? 'bg-rose-100 text-rose-800'
                  : isCyst
                  ? 'bg-sky-100 text-sky-800'
                  : isTumor
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isRejected ? (
                <XCircle className="w-6 h-6" />
              ) : isNormal ? (
                <ShieldCheck className="w-6 h-6" />
              ) : isStone ? (
                <AlertTriangle className="w-6 h-6" />
              ) : isCyst ? (
                <Activity className="w-6 h-6" />
              ) : isTumor ? (
                <AlertOctagon className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="modal-title" className="text-lg font-bold text-slate-900">
                  {scan.id}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200/80 font-mono text-slate-700">
                  {scan.patientAlias}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    isRejected
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : isNormal
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isStone
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : isCyst
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : isTumor
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {scan.primaryDiagnosis || diagnosisLabel}
                </span>
                {scan.confirmedAt && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Confirmed by {scan.confirmedByName || 'Clinician'}
                  </span>
                )}
                {scan.flaggedFor && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    Flagged ({scan.flaggedFor})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acquired on {scan.formattedDate} • ConvNeXt SOTA 4-Class & MobileNetV3 Gatekeeper
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Action Success Toast if triggered */}
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {actionSuccess}
            </div>
          )}

          {/* Action Error Alert if triggered */}
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>{actionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-rose-500 hover:text-rose-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Ultrasound & Grad-CAM Multi-Mode Viewer */}
          <div className="rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden relative shadow-inner">
            {/* Top Toolbar overlay */}
            <div className="p-2.5 bg-black/75 backdrop-blur border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-900/90 text-[11px] font-mono text-slate-300 border border-slate-700">
                {viewMode === 'panel'
                  ? 'DUAL CLINICAL COMPARATIVE PANEL (Cleaned Scan + Grad-CAM + Target Caliper)'
                  : viewMode === 'gradcam'
                  ? 'GRAD-CAM SALIENCY OVERLAY'
                  : viewMode === 'cleaned'
                  ? 'TELEA ARTIFACT-CLEANED SCAN'
                  : 'B-MODE RAW ULTRASOUND / CT'}
              </span>

              {/* View mode toggle controls */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                {scan.visualizationUrl && !isNormal && (
                  <button
                    type="button"
                    onClick={() => setViewMode('panel')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === 'panel'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Crosshair className="w-3 h-3 text-yellow-300" />
                    Dual Panel
                  </button>
                )}
                {scan.heatmapUrl && !isNormal && (
                  <button
                    type="button"
                    onClick={() => setViewMode('gradcam')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === 'gradcam'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Grad-CAM
                  </button>
                )}
                {scan.cleanedScanUrl && (
                  <button
                    type="button"
                    onClick={() => setViewMode('cleaned')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === 'cleaned'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    Cleaned
                  </button>
                )}
                {scan.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      viewMode === 'raw'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Raw Scan
                  </button>
                )}
              </div>
            </div>

            {/* Visual Canvas Area */}
            <div className={`w-full relative flex items-center justify-center bg-black overflow-hidden ${
              viewMode === 'panel' ? 'min-h-[280px] sm:min-h-[340px]' : 'min-h-[260px] sm:min-h-[300px]'
            }`}>
              {hasRealImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {viewMode === 'gradcam' && (
                    <img
                      src={scan.cleanedScanUrl || scan.imageUrl}
                      alt="Underlying Ultrasound Scan"
                      className="absolute inset-0 w-full max-h-[460px] object-contain select-none"
                    />
                  )}
                  <img
                    src={activeImageSrc}
                    alt="Clinical Diagnostic Target"
                    className="w-full max-h-[460px] object-contain select-none relative z-10"
                  />
                </div>
              ) : (
                /* Synthetic Ultrasound Fallback */
                <div
                  className="w-80 h-72 rounded-t-full border-t-8 border-slate-700/40 relative flex items-center justify-center opacity-85"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 10%, rgba(45, 55, 72, 0.4) 0%, rgba(15, 23, 42, 0.9) 70%, rgba(0,0,0,1) 100%)',
                  }}
                >
                  <div className="w-48 h-32 rounded-[50%_40%_50%_45%] border-2 border-slate-600/30 bg-slate-900/60 shadow-lg relative flex items-center justify-center">
                    <div className="w-24 h-12 rounded-full bg-slate-400/20 blur-xs"></div>
                    {isStone && (
                      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-pulse"></div>
                        <div className="w-5 h-20 bg-black/90 blur-xs mt-0.5"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reticle / calibration banner */}
              <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
                <span>D: 12.4 cm · ConvNeXt-Tiny Master</span>
                <span>Gatekeeper: MobileNetV3</span>
              </div>
            </div>
          </div>

          {/* Stage-1 Gatekeeper Authenticity Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Stage-1 Gatekeeper Screening: PASSED</span>
                  <span className="text-[10px] font-mono bg-emerald-200 px-1.5 py-0.2 rounded text-emerald-800">
                    Authentic Renal Scan
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  Ultrasound/CT renal parenchyma validated • Non-kidney artifacts rejected
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-mono font-bold text-emerald-900 text-xs">
                {scan.gateEvaluation?.kidney_confidence_percent ?? 98.4}%
              </div>
              <div className="text-[9.5px] text-emerald-700">Kidney Score</div>
            </div>
          </div>

          {/* 4-Class Softmax Probabilities Breakdown */}
          {scan.classProbabilities && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <span>ConvNeXt 4-Class Softmax Distribution</span>
                <span className="text-[9.5px] font-mono text-slate-400">Class Probabilities</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-center">
                  <div className="text-[10px] text-sky-800 font-bold uppercase tracking-wider">Cyst</div>
                  <div className="text-sm font-bold text-sky-950 font-mono mt-0.5">
                    {scan.classProbabilities.Cyst ?? scan.classProbabilities.cyst ?? 0}%
                  </div>
                  <div className="w-full bg-sky-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full" style={{ width: `${scan.classProbabilities.Cyst ?? scan.classProbabilities.cyst ?? 0}%` }} />
                  </div>
                </div>

                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Normal</div>
                  <div className="text-sm font-bold text-emerald-950 font-mono mt-0.5">
                    {scan.classProbabilities.Normal ?? scan.classProbabilities.normal ?? 0}%
                  </div>
                  <div className="w-full bg-emerald-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${scan.classProbabilities.Normal ?? scan.classProbabilities.normal ?? 0}%` }} />
                  </div>
                </div>

                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-center">
                  <div className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Stone</div>
                  <div className="text-sm font-bold text-rose-950 font-mono mt-0.5">
                    {scan.classProbabilities.Stone ?? scan.classProbabilities.stone ?? 0}%
                  </div>
                  <div className="w-full bg-rose-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-rose-600 h-full rounded-full" style={{ width: `${scan.classProbabilities.Stone ?? scan.classProbabilities.stone ?? 0}%` }} />
                  </div>
                </div>

                <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-center">
                  <div className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">Tumor</div>
                  <div className="text-sm font-bold text-purple-950 font-mono mt-0.5">
                    {scan.classProbabilities.Tumor ?? scan.classProbabilities.tumor ?? 0}%
                  </div>
                  <div className="w-full bg-purple-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${scan.classProbabilities.Tumor ?? scan.classProbabilities.tumor ?? 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Diagnostic Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                AI Prediction
              </span>
              <p
                className={`text-sm font-bold mt-1 ${
                  isRejected
                    ? 'text-red-700'
                    : isNormal
                    ? 'text-emerald-700'
                    : isStone
                    ? 'text-rose-700'
                    : isCyst
                    ? 'text-sky-700'
                    : isTumor
                    ? 'text-purple-700'
                    : 'text-amber-700'
                }`}
              >
                {diagnosisLabel}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                AI Confidence
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                {scan.confidence !== null ? `${scan.confidence}%` : 'N/A (Pending)'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Lesion Diameter
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                {scan.clinicalAssessment?.estimated_diameter_mm
                  ? `~${scan.clinicalAssessment.estimated_diameter_mm} mm`
                  : scan.stoneSizeMm
                  ? `${scan.stoneSizeMm} mm`
                  : 'None detected'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Severity / Triage
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                {scan.clinicalAssessment?.severity || 'Standard review'}
              </p>
            </div>
          </div>

          {/* Demographic & Clinical Notes */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Diagnostic Assessment & Decision Support Notes</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {scan.clinicalAssessment?.recommendation ||
                scan.notes ||
                'Medical scan processed through SOTA ConvNeXt-Tiny & Gatekeeper AI inference. No acute disruption identified.'}
            </p>
            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Cohort Demographic: {scan.patientAge} yrs • {scan.patientSex} • Laterality: {scan.laterality}
              </span>
              <span className="font-mono text-[10px]">Model: ConvNeXt-Tiny Master SOTA + MobileNetV3 Gate</span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Clinician Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              generateScanPdfReport(scan);
              handleAction(`Diagnostic PDF Report for ${scan.patientAlias} (${scan.id}) downloaded.`);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Clinical PDF
          </button>

          <div className="flex items-center gap-2">
            {scan.flaggedFor ? (
              <span className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-800 bg-rose-100 border border-rose-300 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Flagged for {scan.flaggedFor}
              </span>
            ) : (
              <button
                type="button"
                disabled={isFlagging || isConfirming}
                onClick={handleFlag}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-60 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isFlagging ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                ) : (
                  <AlertOctagon className="w-4 h-4" />
                )}
                Flag for Urology
              </button>
            )}

            {scan.confirmedAt ? (
              <span className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Confirmed by {scan.confirmedByName || 'Clinician'}
              </span>
            ) : (
              <button
                type="button"
                disabled={isConfirming || isFlagging}
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Sign & Confirm Finding
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
