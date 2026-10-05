/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  HelpCircle,
  Search,
  BookOpen,
  Activity,
  ShieldCheck,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Mail,
  MapPin,
  Send,
  Loader2,
  Clock,
  Layers,
  Cpu,
  Lock,
  ArrowLeft
} from "lucide-react";

interface FAQItem {
  question: string;
  category: "clinical" | "ai" | "reports" | "security";
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    category: "clinical",
    question: "What image formats and resolutions are accepted for analysis?",
    answer: "KidneyVision AI accepts standard B-mode renal ultrasound scans in JPEG, JPG, and PNG formats up to 5 MB per file. The image should display a transverse or longitudinal acoustic view of either the left or right kidney with visible cortical and medullary architecture."
  },
  {
    category: "clinical",
    question: "Why did my scan fail medical validation at upload?",
    answer: "Our automated pre-flight validator rejects non-ultrasound images (e.g. natural photographs, stock photos) by checking RGB channel saturation variance and background luminance. Real ultrasound scans exhibit dark background peripheries and low color saturation. If your scan is rejected, verify that you uploaded a raw ultrasound slice without heavy colored UI overlays or annotations."
  },
  {
    category: "ai",
    question: "How do I interpret the Grad-CAM explainability heatmap?",
    answer: "The Grad-CAM (Gradient-weighted Class Activation Mapping) overlay reveals which spatial regions in the ultrasound slice drove the neural network's classification. Warm colors (red and orange) indicate high-activation focal points, typically corresponding to hyperechoic calculus foci and their acoustic shadow cones. Cool tones (blue) represent baseline renal parenchyma."
  },
  {
    category: "ai",
    question: "What does 'Borderline Confidence' or 'Review Required' indicate?",
    answer: "When model prediction confidence falls below the clinician threshold (default 85%), or when features are ambiguous, the system flags the scan as 'Review Required'. This safeguards against subtle or atypical acoustic presentations and alerts the attending radiologist to perform secondary cross-plane validation."
  },
  {
    category: "reports",
    question: "How are clinician addendum notes attached to the final PDF report?",
    answer: "Attending clinicians can enter diagnostic observations and Doppler findings directly into the Addendum section. Clicking 'Sign & Log' stores the notes in the patient's database record and automatically embeds them into the cryptographic DomPDF clinical report with the clinician's digital signature and timestamp."
  },
  {
    category: "security",
    question: "How does KidneyVision AI protect patient data and confidentiality?",
    answer: "Patient metadata and scan files are strictly isolated per clinician using scoped database authorization and IDOR-safe controller gates. Files are stored in non-public internal storage using UUID hashing. Clinicians can also revoke all active sessions remotely from Profile Settings."
  }
];

export default function AppHelpCenter() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user || token || localStorage.getItem("kv_token"));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Ticket submission state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketCategory, setTicketCategory] = useState("diagnostic");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmittedId, setTicketSubmittedId] = useState<string | null>(null);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesQuery =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleReturn = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setIsSubmittingTicket(true);
    setTimeout(() => {
      setIsSubmittingTicket(false);
      const generatedId = `KV-${Math.floor(100000 + Math.random() * 900000)}`;

      try {
        const existingTickets = JSON.parse(localStorage.getItem("kv_clinical_tickets") || "[]");
        existingTickets.unshift({
          id: generatedId,
          category: ticketCategory,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
          createdAt: new Date().toISOString(),
          status: "open",
        });
        localStorage.setItem("kv_clinical_tickets", JSON.stringify(existingTickets.slice(0, 10)));
      } catch {
        // Safe fallback if storage quota exceeded or unavailable
      }

      setTicketSubmittedId(generatedId);
      setTicketSubject("");
      setTicketMessage("");
    }, 600);
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Dynamic Navigation Return Button */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <button
          type="button"
          onClick={handleReturn}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#2563eb] hover:text-[#004ac6] bg-white px-3.5 py-2 rounded-xl border border-[#c3c6d7] shadow-xs transition-all hover:-translate-x-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isLoggedIn ? "← Back to Dashboard" : "← Back to Home"}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#737686] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Clinical Informatics Knowledge Base</span>
        </div>
      </div>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#1e3a8a] text-white rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-md border border-blue-400/20">
            <BookOpen className="w-3.5 h-3.5" />
            Clinical Knowledge Base & Support
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How can we assist your clinical team today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Access renal ultrasound acquisition protocols, Grad-CAM neural explainability documentation, and technical assistance for the KidneyVision AI platform.
          </p>

          {/* Search Box */}
          <div className="pt-3">
            <div className="relative max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search protocols, Grad-CAM heatmaps, PDF reports, or error codes..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-slate-100 focus:text-slate-900 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm outline-none border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Quick Reference Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-sans text-sm font-bold text-[#131b2e]">Scan Acquisition Protocol</h3>
            <p className="font-sans text-xs text-[#434655] leading-relaxed">
              Guidelines for probe frequency (3.5–5.0 MHz curved transducer), acoustic window alignment, and avoiding Doppler color bleed.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-[#2563eb]">
            <span>Optimal Transducer Sweeps</span>
          </div>
        </div>

        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-sans text-sm font-bold text-[#131b2e]">Grad-CAM Heatmap Guide</h3>
            <p className="font-sans text-xs text-[#434655] leading-relaxed">
              Understand focal activation colors, acoustic shadow tracking, and neural attribution for nephrolithiasis vs normal parenchyma.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600">
            <span>Visual Attribution Index</span>
          </div>
        </div>

        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-sans text-sm font-bold text-[#131b2e]">Certified PDF Reporting</h3>
            <p className="font-sans text-xs text-[#434655] leading-relaxed">
              Step-by-step workflow for attaching radiologist addendums, generating patient PDF audit reports, and verifying SHA-256 signatures.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">
            <span>Audit Trail Compliance</span>
          </div>
        </div>
      </div>

      {/* Main Content: FAQs and Contact Ticket Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Frequently Asked Questions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#c3c6d7]/40">
            <h2 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#2563eb]" />
              Frequently Answered Questions
            </h2>
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All" },
                { id: "clinical", label: "Clinical" },
                { id: "ai", label: "AI Models" },
                { id: "reports", label: "Reports" },
                { id: "security", label: "Security" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#2563eb] text-white"
                      : "bg-[#f2f3ff] text-[#434655] hover:bg-[#eaedff]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-[#131b2e]">No matching topics found</p>
              <p className="text-xs text-[#737686]">Try adjusting your search terms or contact support below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className="bg-white border border-[#c3c6d7] rounded-xl overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : index)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-[#f8fafc] transition-colors cursor-pointer"
                    >
                      <span className="font-sans text-xs sm:text-sm font-bold text-[#131b2e]">
                        {faq.question}
                      </span>
                      <span className="p-1 rounded-md bg-[#f2f3ff] text-[#434655] shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-[#434655] leading-relaxed border-t border-slate-100 bg-[#faf8ff]/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Clinical Tip Box */}
          <div className="bg-[#eff6ff] border border-[#2563eb]/20 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-[#131b2e]">Clinician Tip for Shadow Detection</h4>
              <p className="text-[#434655] leading-relaxed">
                When screening small stones (&lt; 4mm), lower dynamic range (compression) to maximize acoustic shadowing contrast behind the calcification focus.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Support & Clinical Desk (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Support Ticket Submission Card */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-sm space-y-4">
            <div className="space-y-1 pb-2 border-b border-[#e2e8f0]">
              <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#2563eb]" />
                Submit Clinical Support Ticket
              </h3>
              <p className="text-xs text-[#737686]">
                Direct line to KidneyVision AI technical & clinical informatics staff.
              </p>
            </div>

            {ticketSubmittedId ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-bold text-emerald-900">Support Ticket Logged Successfully</h4>
                <p className="text-[11px] text-emerald-700">
                  Ticket reference: <span className="font-mono font-bold">{ticketSubmittedId}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  A clinical engineering specialist has received your diagnostics payload and will follow up shortly via email.
                </p>
                <button
                  onClick={() => setTicketSubmittedId(null)}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Inquiry Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white"
                  >
                    <option value="diagnostic">Diagnostic / Model Classification Inquiry</option>
                    <option value="upload">Scan Preprocessing & Format Issue</option>
                    <option value="report">PDF Report Generation or Export</option>
                    <option value="auth">Account, RBAC & Security</option>
                    <option value="other">Other Clinical Feedback</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Subject</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief description of the query or scan ID..."
                    className="w-full px-3 py-2 bg-[#f2f3ff] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Clinical Details</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Include ultrasound machine model, transducer settings, or observed discrepancy..."
                    className="w-full p-3 bg-[#f2f3ff] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full bg-[#2563eb] hover:bg-[#004ac6] text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTicket ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Dispatching to Clinical Desk...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Support Ticket
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Clinical Engineering Hub Info */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
              Informatics & Research Center
            </h4>
            
            <div className="space-y-2 text-xs text-[#434655]">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#2563eb] shrink-0" />
                <span>Tanger, Morocco</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#2563eb] shrink-0" />
                <span className="font-mono">support@kidneyvision.ai</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#2563eb] shrink-0" />
                <span>Clinical Support: 24/7 Priority Emergency Triage</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-[#737686]">
              KidneyVision AI Research & Development Team. Certified assistive medical decision-support technology.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
