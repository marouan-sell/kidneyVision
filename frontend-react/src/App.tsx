import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { 
  Activity, ShieldCheck, History, Settings, LogOut, FileText, 
  LayoutDashboard, User, HelpCircle, Eye, Menu, X, PlusCircle, BrainCircuit
} from "lucide-react";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import React, { Suspense } from "react";
import LoadingSkeleton from "./components/common/LoadingSkeleton";
import ErrorBoundary from "./components/common/ErrorBoundary";

const AppDashboard = React.lazy(() => import("./components/AppDashboard"));
const AppNewAnalysis = React.lazy(() => import("./components/AppNewAnalysis"));
const AppHistory = React.lazy(() => import("./components/AppHistory"));
const AppReports = React.lazy(() => import("./components/AppReports"));
const AppSettings = React.lazy(() => import("./components/AppSettings"));
const AppHelpCenter = React.lazy(() => import("./components/AppHelpCenter"));
const GuestAnalysis = React.lazy(() => import("./components/GuestAnalysis"));
const ForgotPassword = React.lazy(() => import("./components/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./components/ResetPassword"));
const PrivacyPage = React.lazy(() => import("./components/PrivacyPage"));
const TermsPage = React.lazy(() => import("./components/TermsPage"));

import { AuthProvider, useAuth } from "./contexts/AuthContext";

function PortalLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/analysis")) return "analysis";
    if (path.includes("/history")) return "history";
    if (path.includes("/reports")) return "reports";
    if (path.includes("/settings")) return "settings";
    if (path.includes("/help")) return "help";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div id="portal-full-layout" className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col lg:flex-row font-sans selection:bg-[#b4c5ff]">
      
      {/* Mobile Bar Controls */}
      <header className="lg:hidden bg-white border-b border-[#c3c6d7] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center">
          <span className="font-sans font-bold text-base text-[#131b2e] tracking-tight">
            KidneyVision <span className="text-[#2563eb]">AI</span>
          </span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-[#434655] hover:text-[#131b2e]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* SideNavBar */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-[#f2f3ff] border-r border-[#c3c6d7]/70 w-64 p-6 flex flex-col justify-between z-30 transform lg:transform-none lg:static transition-transform duration-300 lg:h-screen lg:sticky lg:top-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          <div className="px-2 py-3 mb-2 text-left">
            <h1 className="font-sans text-xl font-extrabold text-[#111827] tracking-tight leading-none">
              KidneyVision <span className="text-[#2563eb]">AI</span>
            </h1>
            <p className="font-sans text-[10px] text-[#737686] uppercase tracking-wider mt-1.5 font-bold">
              Clinical Portal
            </p>
          </div>

          <div className="px-1.5">
            <button 
              onClick={() => {
                navigate("/analysis");
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-xl py-2.5 px-4 text-xs font-semibold hover:shadow-md transition-all active:scale-[0.98] duration-100 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              New Analysis
            </button>
          </div>

          <nav className="flex flex-col gap-1.5 px-1 font-sans text-xs">
            <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left cursor-pointer ${
                activeTab === "dashboard" ? "bg-[#eaedff] text-[#2563eb] font-bold shadow-sm translate-x-1" : "text-[#434655] hover:text-[#131b2e] hover:bg-[#eaedff]/45"
            }`}>
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0" /> Dashboard
            </Link>
            <Link to="/analysis" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left cursor-pointer ${
                activeTab === "analysis" ? "bg-[#eaedff] text-[#2563eb] font-bold shadow-sm translate-x-1" : "text-[#434655] hover:text-[#131b2e] hover:bg-[#eaedff]/45"
            }`}>
              <Activity className="w-4.5 h-4.5 shrink-0" /> New Analysis
            </Link>
            <Link to="/history" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left cursor-pointer ${
                activeTab === "history" ? "bg-[#eaedff] text-[#2563eb] font-bold shadow-sm translate-x-1" : "text-[#434655] hover:text-[#131b2e] hover:bg-[#eaedff]/45"
            }`}>
              <History className="w-4.5 h-4.5 shrink-0" /> History
            </Link>
            <Link to="/reports" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left cursor-pointer ${
                activeTab === "reports" ? "bg-[#eaedff] text-[#2563eb] font-bold shadow-sm translate-x-1" : "text-[#434655] hover:text-[#131b2e] hover:bg-[#eaedff]/45"
            }`}>
              <FileText className="w-4.5 h-4.5 shrink-0" /> Reports
            </Link>
            <Link to="/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left cursor-pointer ${
                activeTab === "settings" ? "bg-[#eaedff] text-[#2563eb] font-bold shadow-sm translate-x-1" : "text-[#434655] hover:text-[#131b2e] hover:bg-[#eaedff]/45"
            }`}>
              <Settings className="w-4.5 h-4.5 shrink-0" /> Settings
            </Link>
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-1.5 px-1 pt-4 border-t border-[#c3c6d7]/30">
          <Link
            to="/help"
            className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all text-left cursor-pointer ${
              activeTab === "help"
                ? "bg-[#eaedff] text-[#2563eb] font-bold shadow-sm translate-x-1"
                : "text-[#434655] hover:text-[#131b2e] hover:bg-[#eaedff]/40"
            }`}
          >
            <HelpCircle className="w-4.5 h-4.5 shrink-0" />
            Help Center
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-[#434655] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0 text-neutral-500 hover:text-red-500" />
            Logout
          </button>

          <Link 
            to="/settings?tab=profile"
            className="mt-4 px-2 py-2 flex items-center gap-3 border-t border-[#c3c6d7]/20 pt-4 hover:bg-[#eaedff]/60 rounded-xl transition-all group cursor-pointer"
            title="Clinician Profile & Settings"
          >
            <img 
              alt="Clinician Avatar Badge" 
              className="w-9 h-9 rounded-full object-cover border border-[#c3c6d7] group-hover:border-[#2563eb] transition-all" 
              src={user?.avatarUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80"}
            />
            <div className="flex flex-col min-w-0 text-left">
              <span className="font-sans text-xs text-[#131b2e] font-bold truncate group-hover:text-[#2563eb] transition-colors">
                {user?.name || "Dr. Marouan Sellami"}
              </span>
              <span className="text-[10px] text-[#737686] font-semibold tracking-wider font-sans mt-0.5 uppercase group-hover:text-[#2563eb]/80 transition-colors">
                Radiology
              </span>
            </div>
          </Link>
        </div>
      </aside>

      <main className={`flex-1 overflow-y-auto w-full ${activeTab === "dashboard" ? "p-0 max-w-none" : "p-6 md:p-10 lg:p-12 max-w-7xl mx-auto"}`}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<AppDashboard />} />
              <Route path="/analysis" element={<AppNewAnalysis onAddSuccess={() => navigate("/history")} />} />
              <Route path="/history" element={<AppHistory />} />
              <Route path="/reports" element={<AppReports />} />
              <Route path="/settings" element={<AppSettings />} />
              <Route path="/help" element={<AppHelpCenter />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function PublicLandingWrapper() {
  const navigate = useNavigate();
  return (
    <LandingPage 
      onNavigateToAuth={() => navigate("/login")} 
      onEnterPortalDirectly={() => navigate("/guest")} 
      onNavigateToInfo={(page) => navigate(`/${page}`)} 
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLandingWrapper />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<Suspense fallback={<LoadingSkeleton />}><ForgotPassword /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<LoadingSkeleton />}><ResetPassword /></Suspense>} />
          <Route path="/guest" element={<GuestAnalysis />} />
          <Route path="/privacy" element={<Suspense fallback={<LoadingSkeleton />}><PrivacyPage /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<LoadingSkeleton />}><TermsPage /></Suspense>} />

          {/* Protected Routes rendered inside PortalLayout */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
