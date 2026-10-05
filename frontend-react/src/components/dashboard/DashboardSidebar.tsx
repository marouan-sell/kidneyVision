import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileBarChart,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';

interface DashboardSidebarProps {
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  onNewScanClick: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isOpenMobile,
  onToggleMobile,
  onNewScanClick,
}) => {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Patient History', icon: History, active: false },
    { label: 'Clinical Reports', icon: FileBarChart, active: false },
    { label: 'System Settings', icon: Settings, active: false },
    { label: 'Help & Docs', icon: HelpCircle, active: false },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Clean Typographic Brand */}
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-1.5">
                KidneyVision <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700">AI</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 block mt-0.5">
                Renal Decision Support
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onToggleMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Ultrasound Scan CTA */}
          <div className="p-4">
            <button
              type="button"
              onClick={onNewScanClick}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Analysis</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none ${
                    item.active
                      ? 'bg-sky-50 text-sky-800 font-bold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      item.active ? 'text-sky-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-600" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Minimal Pipeline Status & Clinician */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              CNN Inference
            </span>
            <span className="font-mono text-[10px] text-slate-400">Online</span>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                MS
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">Marwan Sellami</p>
                <p className="text-[10px] text-slate-400">Radiology</p>
              </div>
            </div>

            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
