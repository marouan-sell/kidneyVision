import React, { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, ArrowLeft, Loader2, RefreshCw, AlertCircle, Printer, FileText, Layers, Eye, ShieldCheck, Sparkles } from "lucide-react";
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

  return (
    <div className="bg-[#fcfcff] text-[#131b2e] min-h-screen flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-2xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-[#434655] hover:text-[#2563eb] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </a>

        <div className="bg-white border border-[#c3c6d7] rounded-xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Guest AI Analysis</h1>
          <p className="text-sm text-[#434655] mb-8">
            Upload a renal ultrasound scan for a rapid AI prediction. (Records are not saved).
          </p>

          {!result ? (
            <form onSubmit={handleUpload} className="space-y-6">
              <div 
                className={`w-full ${file ? 'h-auto' : 'h-48'} bg-[#f2f3ff] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition-colors ${file ? 'border-[#2563eb] bg-[#eaedff]' : 'border-[#c3c6d7] hover:border-[#2563eb]/60'} overflow-hidden relative`}
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
                  <div className="w-full relative">
                    <img
                      src={previewUrl}
                      alt="Uploaded Scan"
                      className="w-full h-auto object-contain rounded-lg"
                    />
                    <label htmlFor="guest-upload" className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors rounded-lg">
                       <span className="sr-only">Change Image</span>
                    </label>
                  </div>
                ) : (
                  <label htmlFor="guest-upload" className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                    <UploadCloud className="w-10 h-10 mb-3 text-[#737686]" />
                    <span className="text-sm font-semibold text-[#131b2e] mb-1">Click to browse or drag image here</span>
                    <span className="text-xs text-[#737686]">Supports standard ultrasound imaging formats (PNG, JPG)</span>
                  </label>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={!file || loading}
                className="w-full bg-[#2563eb] hover:bg-[#004ac6] text-white font-semibold py-3 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {loading ? "Analyzing..." : "Analyze Image"}
              </button>
            </form>
          ) : (
            <div className="space-y-6 animate-[fadeIn_300ms_ease-out]">
              {/* Imaging HUD Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-[#eaedff] border border-[#c3c6d7] rounded-xl text-xs font-semibold">
                <div className="flex flex-wrap items-center gap-1.5">
                  {result.visualizationUrl && (result.prediction || '').toLowerCase() !== 'normal' && (
                    <button
                      type="button"
                      onClick={() => setViewMode('panel')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'panel'
                          ? 'bg-[#2563eb] text-white shadow-sm'
                          : 'text-[#434655] hover:text-[#131b2e] hover:bg-white/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Dual Clinical Panel
                    </button>
                  )}
                  {result.heatmapUrl && (result.prediction || '').toLowerCase() !== 'normal' && (
                    <button
                      type="button"
                      onClick={() => setViewMode('gradcam')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'gradcam'
                          ? 'bg-[#2563eb] text-white shadow-sm'
                          : 'text-[#434655] hover:text-[#131b2e] hover:bg-white/60'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Grad-CAM Heatmap
                    </button>
                  )}
                  {result.cleanedScanUrl && (
                    <button
                      type="button"
                      onClick={() => setViewMode('cleaned')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'cleaned'
                          ? 'bg-[#2563eb] text-white shadow-sm'
                          : 'text-[#434655] hover:text-[#131b2e] hover:bg-white/60'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Cleaned Scan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'raw'
                        ? 'bg-[#2563eb] text-white shadow-sm'
                        : 'text-[#434655] hover:text-[#131b2e] hover:bg-white/60'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Original Scan
                  </button>
                </div>

                <span className="text-[11px] text-[#737686] px-2 py-0.5 uppercase tracking-wider font-mono">
                  {viewMode === 'panel' ? 'Side-by-Side Dual HUD' : viewMode === 'gradcam' ? 'ResNet Activation' : viewMode === 'cleaned' ? 'Noise Filtered' : 'Raw Input'}
                </span>
              </div>

              {/* Image Viewport */}
              <div className="aspect-video bg-[#0b1329] rounded-xl overflow-hidden flex items-center justify-center border border-[#c3c6d7] relative shadow-inner">
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
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Ultrasound Gatekeeper Verification Badge */}
              {result.gateEvaluation && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Ultrasound Gatekeeper: <strong>Verified Renal Scan</strong>
                    </span>
                  </div>
                  {result.gateEvaluation.kidney_confidence_percent !== undefined && (
                    <span className="font-mono text-emerald-700 font-semibold">
                      {result.gateEvaluation.kidney_confidence_percent}% Match
                    </span>
                  )}
                </div>
              )}

              <div className="bg-[#f2f3ff] border border-[#c3c6d7] rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#737686] uppercase tracking-wider mb-1">Diagnostic Output</h3>
                    <div className="text-xl font-bold text-[#131b2e] flex items-center gap-2">
                      <CheckCircle2 className={`w-5 h-5 ${
                        result.prediction.toLowerCase().includes('normal')
                          ? 'text-emerald-600'
                          : result.prediction.toLowerCase().includes('cyst')
                          ? 'text-teal-600'
                          : result.prediction.toLowerCase().includes('tumor')
                          ? 'text-purple-600'
                          : 'text-rose-600'
                      }`} />
                      {result.prediction}
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xs font-bold text-[#737686] uppercase tracking-wider mb-1">Confidence Score</h3>
                    <div className="text-xl font-bold text-[#131b2e]">{result.confidence}%</div>
                  </div>
                </div>

                {result.classProbabilities && (
                  <div className="mt-4 pt-4 border-t border-[#c3c6d7]/60">
                    <h4 className="text-[11px] font-bold text-[#737686] uppercase tracking-wider mb-2">
                      4-Class Probability Spectrum
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(result.classProbabilities).map(([cls, rawPct]) => {
                        const pct = typeof rawPct === 'number' ? rawPct : Number(rawPct) || 0;
                        const isPred = cls.toLowerCase() === result.prediction?.toLowerCase();
                        let barColor = 'bg-slate-400';
                        if (cls === 'Normal') barColor = 'bg-emerald-500';
                        else if (cls === 'Stone') barColor = 'bg-rose-500';
                        else if (cls === 'Cyst') barColor = 'bg-teal-500';
                        else if (cls === 'Tumor') barColor = 'bg-purple-600';

                        return (
                          <div key={cls} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className={isPred ? "font-bold text-[#131b2e]" : "text-[#434655]"}>
                                {cls} {isPred && "★ (Primary Finding)"}
                              </span>
                              <span className="font-mono text-xs">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
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


              {result.usageCount !== undefined && result.usageLimit !== undefined && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">
                      Guest Usage: {result.usageCount} of {result.usageLimit} free analyses used.
                    </p>
                    {result.usageCount >= result.usageLimit && (
                      <p className="text-sm text-amber-700 mt-1">
                        You have reached your limit! Please register to continue using the platform.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Report Information Banner */}
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-3 text-xs text-[#166534] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#16a34a] shrink-0" />
                  <span>Official, signed diagnostic PDF dossiers are archived permanently in the <strong>Clinical Portal</strong>.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2.5 bg-white border border-[#2563eb] text-[#2563eb] hover:bg-blue-50 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Print or Save PDF"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button 
                  type="button"
                  onClick={() => { setFile(null); setResult(null); }}
                  className="flex-1 px-4 py-2.5 border border-[#c3c6d7] rounded-lg text-sm font-semibold text-[#434655] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
                >
                  Analyze Another
                </button>
                <button 
                  type="button"
                  onClick={() => window.location.href = '/register'}
                  className="flex-1 px-4 py-2.5 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
