import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Clinical Portal ErrorBoundary caught error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-left">
          <div className="bg-white border border-red-200 rounded-2xl shadow-lg p-6 max-w-lg w-full space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[#131b2e]">
                  {this.props.fallbackTitle || "Application Interface Recovery"}
                </h3>
                <p className="text-xs text-[#434655] mt-1 leading-relaxed">
                  {this.props.fallbackMessage || 
                    "An unexpected error occurred while rendering the clinical interface. Your session and patient data remain secure."}
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-800">
                <span className="font-bold block mb-1">Diagnostic Detail:</span>
                <p className="font-mono text-[11px] break-all">{this.state.error.message || String(this.state.error)}</p>
              </div>
            )}

            <div className="bg-[#f2f3ff] p-3 rounded-xl border border-[#c3c6d7]/50 text-xs text-[#434655]">
              <span className="font-semibold text-[#131b2e] block mb-1">Recommended Action:</span>
              <p>Click below to re-initialize the diagnostic workshop or navigate back to the dashboard.</p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#e2e8f0]">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-[#2563eb] hover:bg-[#004ac6] text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Interface
              </button>
              <button
                onClick={() => {
                  this.handleReset();
                  window.location.href = "/dashboard";
                }}
                className="px-3.5 py-2 border border-[#c3c6d7] hover:bg-[#faf8ff] text-xs font-semibold text-[#131b2e] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
