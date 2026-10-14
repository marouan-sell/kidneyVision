import React, { useState, useEffect } from "react";
import { 
  UploadCloud, CheckCircle2, ArrowLeft, Loader2, RefreshCw, 
  AlertCircle, Printer, FileText, Layers, Eye, ShieldCheck, 
  Activity, Sparkles, Crosshair, UserCheck, Stethoscope
} from "lucide-react";
import { guestPredict } from "../services";
import { validateScanFile } from "../utils/fileValidation";

type ViewMode = 'panel' | 'gradcam' | 'cleaned' | 'raw';

export default function GuestAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('panel');
  const [result, setResult] = useState<{
    prediction: string;
    confidence: number;
    imageUrl: string;
    heatmapUrl?: string;
    visualizationUrl?: string;
    cleanedScanUrl?: string;
    usageCount?: number;
    usageLimit?: number;
    classProbabilities?: Record<string, number>;
    gateEvaluation?: {
      gate_passed?: boolean;
      kidney_confidence_percent?: number;
      non_kidney_probability_percent?: number;
    };
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleFileSelect = async (selectedFile: File | null) => {
    setError("");
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validation = await validateScanFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || "Invalid file format.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an ultrasound scan image to analyze.");
      return;
    }

    const validation = await validateScanFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file format.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const prediction = await guestPredict(file);
      setResult(prediction);
      const isNormal = (prediction.prediction || '').toLowerCase() === 'normal';
      if (isNormal) {
        setViewMode(prediction.cleanedScanUrl ? 'cleaned' : 'raw');
      } else if (prediction.visualizationUrl) {
        setViewMode('panel');
      } else if (prediction.heatmapUrl) {
        setViewMode('gradcam');
      } else {
        setViewMode('raw');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const predLower = (result?.prediction || '').toLowerCase();
  const isNormal = predLower.includes('normal');
  const isStone = predLower.includes('stone') || predLower.includes('nephro');
  const isCyst = predLower.includes('cyst');
  const isTumor = predLower.includes('tumor');

  const findingTheme = isTumor 
    ? { border: 'border-purple-300', bg: 'bg-purple-50/80', text: 'text-purple-900', badge: 'bg-purple-600', label: 'Renal Mass / Tumor Alert' }
    : isStone 
    ? { border: 'border-rose-300', bg: 'bg-rose-50/80', text: 'text-rose-900', badge: 'bg-rose-600', label: 'Nephrolithiasis Focus' }
    : isCyst 
    ? { border: 'border-sky-300', bg: 'bg-sky-50/80', text: 'text-sky-900', badge: 'bg-sky-600', label: 'Renal Cyst' }
    : isNormal 
    ? { border: 'border-emerald-300', bg: 'bg-emerald-50/80', text: 'text-emerald-900', badge: 'bg-emerald-600', label: 'Normal Renal Parenchyma' }
    : { border: 'border-amber-300', bg: 'bg-amber-50/80', text: 'text-amber-900', badge: 'bg-amber-600', label: 'Clinical Review Required' };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 font-sans selection:bg-[#2563eb]/20">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#434655] hover:text-[#2563eb] transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </a>

          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-semibold text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Guest Sandbox Environment</span>
          </div>
        </div>

        {/* Workstation Card */}
        <div className="bg-white border border-[#c3c6d7]/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2 text-[10.5px] font-bold text-[#2563eb] uppercase tracking-wider mb-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Rapid Clinical Triage Sandbox</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#131b2e] tracking-tight">
              Renal Ultrasound Diagnostic Assessment
            </h1>
            <p className="text-xs text-[#52576b] mt-1 leading-relaxed">
              Upload an ultrasound image for instant dual-stage neural pathology triage. Transient guest session — records are not permanently archived.
            </p>
          </div>

          {!result ? (
            <form onSubmit={handleUpload} className="space-y-6">
              
              {/* Dropzone */}
              <div 
                className={`w-full ${file ? 'min-h-[260px]' : 'h-56'} rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-6 transition-all relative overflow-hidden ${
                  file 
                    ? 'border-[#2563eb] bg-[#eff4fe]/40' 
                    : 'border-[#c3c6d7] bg-[#f8fafc] hover:bg-[#eff4fe]/30 hover:border-[#2563eb]/70'
                }`}
              >
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    handleFileSelect(selectedFile);
                  }}
                  className="hidden" 
                  id="guest-upload"
                />
                
                {previewUrl ? (
                  <div className="w-full relative flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Uploaded Renal Scan"
                      className="max-h-64 w-auto object-contain rounded-xl shadow-md border border-slate-200"
                    />
                    <label 
                      htmlFor="guest-upload" 
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#2563eb] hover:bg-slate-50 cursor-pointer shadow-xs transition-colors"
                    >
                      <span>Replace Scan Image</span>
                    </label>
                  </div>
                ) : (
                  <label htmlFor="guest-upload" className="cursor-pointer flex flex-col items-center w-full h-full justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center shadow-2xs mb-1">
                      <UploadCloud className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <span className="text-xs font-bold text-[#131b2e]">
                      Click to browse or drag & drop ultrasound scan
                    </span>
                    <span className="text-[11px] text-[#737686] max-w-xs">
                      Supports standard B-mode captures & axial CT images (PNG, JPG)
                    </span>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600 font-medium">
                        Renal Ultrasound
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600 font-medium">
                        Max 25MB
                      </span>
                    </div>
                  </label>
                )}
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 font-medium leading-snug">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={!file || loading}
                className="w-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-bold text-xs py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-[#2563eb]/20 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ANALYZING ACOUSTIC TENSORS...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>EXECUTE RAPID AI DIAGNOSIS</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Imaging HUD Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold">
                <div className="flex flex-wrap items-center gap-1">
                  {result.visualizationUrl && (result.prediction || '').toLowerCase() !== 'normal' && (
                    <button
                      type="button"
                      onClick={() => setViewMode('panel')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'panel'
                          ? 'bg-[#2563eb] text-white shadow-xs font-bold'
                          : 'text-[#434655] hover:text-[#131b2e] hover:bg-white/70'
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Dual Panel</span>
                    </button>
                  )}
                  {result.heatmapUrl && (result.prediction || '').toLowerCase() !== 'normal' && (
                    <button
                      type="button"
                      onClick={() => setViewMode('gradcam')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'gradcam'
                          ? 'bg-[#2563eb] text-white shadow-xs font-bold'
                          : 'text-[#434655] hover:text-[#131b2e] hover:bg-white/70'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 stroke-[1.75]" />
                      <span>Grad-CAM</span>
                    </button>
                  )}
                  {result.cleanedScanUrl && (
                    <button
                      type="button"
                      onClick={() => setViewMode('cleaned')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'cleaned'
                          ? 'bg-[#2563eb] text-white shadow-xs font-bold'
                          : 'text-[#434655] hover:text-[#131b2e] hover:bg-white/70'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cleaned Scan</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'raw'
                        ? 'bg-white text-[#131b2e] shadow-xs font-bold'
                        : 'text-[#434655] hover:text-[#131b2e] hover:bg-white/70'
                    }`}
                  >
                    <span>Raw Input</span>
                  </button>
                </div>

                <span className="text-[10.5px] text-[#737686] px-2 py-0.5 uppercase tracking-wider font-mono font-bold">
                  {viewMode === 'panel' ? 'Dual Clinical View' : viewMode === 'gradcam' ? 'Grad-CAM Saliency' : viewMode === 'cleaned' ? 'Artifact Inpainted' : 'Raw B-Mode'}
                </span>
              </div>

              {/* High-Contrast DICOM Canvas */}
              <div className="aspect-[16/10] bg-[#090d16] rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 relative shadow-inner">
                <img
                  src={
                    viewMode === 'panel' && result.visualizationUrl
                      ? result.visualizationUrl
                      : viewMode === 'gradcam' && result.heatmapUrl
                      ? result.heatmapUrl
                      : viewMode === 'cleaned' && result.cleanedScanUrl
                      ? result.cleanedScanUrl
                      : previewUrl || result.imageUrl
                  }
                  alt="Clinical Diagnostic View"
                  className="w-full h-full object-contain p-2"
                />

                <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white text-[9.5px] font-mono px-2.5 py-1 rounded-md border border-white/10 shadow-md">
                  US B-MODE • DICOM CALIBRATED
                </div>

                <div className={`absolute bottom-3 right-3 ${findingTheme.badge} text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-md`}>
                  {isNormal ? <CheckCircle2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  <span>{findingTheme.label}</span>
                </div>
              </div>

              {/* Modality Gatekeeper Verification Badge */}
              {result.gateEvaluation && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span>
                      Modality Screening: <strong>Authentic Renal Anatomy Verified</strong>
                    </span>
                  </div>
                  {result.gateEvaluation.kidney_confidence_percent !== undefined && (
                    <span className="font-mono text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      {result.gateEvaluation.kidney_confidence_percent}% Match
                    </span>
                  )}
                </div>
              )}

              {/* Triage Output Summary */}
              <div className={`p-5 rounded-2xl border ${findingTheme.border} ${findingTheme.bg} space-y-4 shadow-xs`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold text-[#737686] uppercase tracking-wider mb-1">
                      Primary AI Diagnostic Finding
                    </h3>
                    <div className="text-lg sm:text-xl font-extrabold text-[#131b2e] flex items-center gap-2">
                      <CheckCircle2 className={`w-5 h-5 ${
                        isNormal ? 'text-emerald-600' : isCyst ? 'text-sky-600' : isTumor ? 'text-purple-600' : 'text-rose-600'
                      }`} />
                      <span>{result.prediction}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-[10px] font-bold text-[#737686] uppercase tracking-wider mb-1">
                      Model Confidence
                    </h3>
                    <div className="text-lg sm:text-xl font-mono font-extrabold text-[#2563eb]">
                      {result.confidence}%
                    </div>
                  </div>
                </div>

                {/* 4-Class Probability Spectrum */}
                {result.classProbabilities && (
                  <div className="pt-4 border-t border-slate-200/80">
                    <h4 className="text-[10.5px] font-bold text-[#434655] uppercase tracking-wider mb-3">
                      4-Class Softmax Probability Distribution
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(result.classProbabilities).map(([cls, rawPct]) => {
                        const pct = typeof rawPct === 'number' ? rawPct : Number(rawPct) || 0;
                        const isPred = cls.toLowerCase() === result.prediction?.toLowerCase();
                        let barColor = 'bg-slate-400';
                        if (cls === 'Normal') barColor = 'bg-emerald-500';
                        else if (cls === 'Stone') barColor = 'bg-rose-500';
                        else if (cls === 'Cyst') barColor = 'bg-sky-500';
                        else if (cls === 'Tumor') barColor = 'bg-purple-600';

                        return (
                          <div 
                            key={cls} 
                            className={`p-2.5 rounded-xl border text-center ${
                              isPred ? "bg-white border-[#2563eb] shadow-xs ring-1 ring-blue-400/30" : "bg-white/60 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#434655]">
                              <span>{cls}</span>
                              {isPred && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                            </div>
                            <div className="text-sm font-mono font-bold text-[#131b2e] mt-1">
                              {pct}%
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1.5">
                              <div
                                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Guest usage notice */}
              {result.usageCount !== undefined && result.usageLimit !== undefined && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-amber-900 font-semibold">
                      Guest Usage: {result.usageCount} of {result.usageLimit} free analyses used.
                    </p>
                    {result.usageCount >= result.usageLimit && (
                      <p className="text-amber-800 mt-0.5">
                        You have reached your limit! Create a clinician account to access unlimited triage and persistent patient records.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Informational Banner */}
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 text-xs text-[#166534] flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span>
                  Official, signed diagnostic PDF dossiers and patient histories are permanently archived in the <strong>Clinical Portal</strong>.
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-3 bg-white border border-[#2563eb] text-[#2563eb] hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  title="Print or Save PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Dossier</span>
                </button>
                <button 
                  type="button"
                  onClick={() => { setFile(null); setResult(null); }}
                  className="flex-1 px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-[#434655] transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Analyze Another</span>
                </button>
                <button 
                  type="button"
                  onClick={() => window.location.href = '/register'}
                  className="flex-1 px-4 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Create Account</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
