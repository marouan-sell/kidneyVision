import {
  ArrowRight,
  Brain,
  Database,
  FileText,
  Github,
  Instagram,
  LockKeyhole,
  Menu,
  Network,
  ShieldCheck,
  Target,
  UploadCloud,
  User,
  X,
  Zap,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import kidneyMedicalIllustration from "../assets/kidney-transparent.png";
import ultrasoundPreview from "../assets/ultrasound-preview.png";
import { Brand, KaggleIcon } from "./common/Brand";
import { ArrowButton, Button, Card, SectionEyebrow } from "./common/UI";

export interface LandingPageProps {
  onNavigateToAuth: () => void;
  onEnterPortalDirectly: () => void;
  onNavigateToInfo?: (page: "privacy" | "terms") => void;
}

const navItems = ["Home", "About", "Features", "Results", "Team", "Why Us"];

const stats = [
  { icon: Database, value: "9,416+", label: "Medical CT & Ultrasound Scans" },
  { icon: Target, value: "99.8%", label: "Average 4-Class Diagnostic Accuracy" },
  { icon: Zap, value: "< 2.0s", label: "Dual-Stage Pipeline Inference Speed" },
  { icon: Network, value: "4 Pathologies", label: "Cyst, Normal, Stone, and Tumor" },
  { icon: ShieldCheck, value: "Gatekeeper", label: "MobileNetV3 Acoustic Screening" },
];

const features = [
  { icon: UploadCloud, title: "Ultrasound & CT Upload", text: "Upload B-mode renal ultrasound and CT scans in seconds." },
  { icon: Brain, title: "4-Class Deep Inference", text: "ConvNeXt-Tiny classifying Cyst, Normal, Stone, and Tumor." },
  { icon: ShieldCheck, title: "Gatekeeper AI", text: "Screens and rejects non-renal images before clinical classification." },
  { icon: Target, title: "Grad-CAM Heatmaps", text: "Explainable AI visual saliency with lesion diameter estimation." },
  { icon: FileText, title: "Certified PDF Reports", text: "Certified reports with clinician addenda and audit logging." },
];

const benefits = [
  { icon: Target, title: "High Accuracy", text: "Trained on 9,416 images with 99.8% average project accuracy." },
  { icon: Zap, title: "Fast & Efficient", text: "Results designed for rapid analysis in under 3.5 seconds." },
  { icon: FileText, title: "Easy to Use", text: "A clear workflow for upload, prediction, and report access." },
  { icon: ShieldCheck, title: "Secure & Private", text: "Encrypted handling patterns and protected access flows." },
];

const workflowSteps: Array<{ number: string; icon: LucideIcon; title: string; text: string }> = [
  { number: "1", icon: UploadCloud, title: "Upload Image", text: "Add your renal ultrasound image. Support JPG and PNG." },
  { number: "2", icon: Brain, title: "AI Analysis", text: "The deep learning model analyzes the image." },
  { number: "3", icon: FileText, title: "Get Results", text: "View prediction, confidence score, and access the report." },
];

const creators = [
  { name: "Marouan Sellami", role: "Full Stack Developer", github: "https://github.com", kaggle: "https://kaggle.com", instagram: "https://instagram.com" },
  { name: "Souhibe Bakkali", role: "Machine Learning Engineer", github: "https://github.com", kaggle: "https://kaggle.com", instagram: "https://instagram.com" },
  { name: "Mossab Oueld Neimia", role: "UI/UX Designer", github: "https://github.com", kaggle: "https://kaggle.com", instagram: "https://instagram.com" },
];

function MedicalKidneyVisual({ className = "", imageClassName = "" }: { className?: string; imageClassName?: string }) {
  return (
    <div className={`pointer-events-none relative ${className}`} aria-hidden="true">
      <div className="diagnostic-pulse absolute inset-8 rounded-full border border-blue-300/60 bg-blue-200/10" />
      <div className="kidney-float relative z-10 h-full w-full">
        <img
          src={kidneyMedicalIllustration}
          alt=""
          className={`h-full w-full object-contain drop-shadow-[0_18px_34px_rgba(37,99,235,0.18)] ${imageClassName}`}
        />
      </div>
    </div>
  );
}

export default function LandingPage({ onNavigateToAuth, onEnterPortalDirectly, onNavigateToInfo }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".scroll-reveal, .reveal-item");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -70px 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (item: string) => {
    setMenuOpen(false);
    const target = item === "Home" ? "top" : item === "Why Us" ? "why-us" : item.toLowerCase();
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="top" className="min-h-screen overflow-hidden bg-[#fcfcff] text-[#131b2e]">
      <header className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="relative text-sm font-semibold text-[#0f3f88] transition hover:text-[#2563eb]"
              >
                {item}
                {item === "Home" ? <span className="absolute -bottom-3 left-0 h-0.5 w-full rounded-full bg-[#2563eb]" /> : null}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Button variant="secondary" onClick={onNavigateToAuth}>
              <User className="h-4 w-4" />
              Log In / Sign Up
            </Button>
            <ArrowButton onClick={onEnterPortalDirectly}>
              <User className="h-4 w-4" />
              Analyze as Guest
            </ArrowButton>
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 text-[#0f3f88] lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle mobile menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t border-blue-100 bg-white px-5 py-4 lg:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <button key={item} onClick={() => scrollToSection(item)} className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#0f3f88] hover:bg-blue-50">
                  {item}
                </button>
              ))}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Button variant="secondary" onClick={onNavigateToAuth}>Log In / Sign Up</Button>
                <Button onClick={onEnterPortalDirectly}>Analyze as Guest</Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative border-b border-blue-100 bg-gradient-to-br from-[#f5fbff] via-white to-[#eaf5ff]">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
            <div className="relative z-10">
              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-[#0f3f88] sm:text-5xl lg:text-6xl">
                Multi-Pathology Renal AI.
                <span className="block text-[#1267d8]">From Scan to Clinical Triage.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#1d4380]">
                Upload renal ultrasound or CT imaging for automated Stage-1 Gatekeeper screening, SOTA 4-class multi-pathology classification (Cyst, Normal, Stone, Tumor), and Grad-CAM explainability heatmaps.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <ArrowButton className="min-w-52" onClick={onEnterPortalDirectly}>
                  <User className="h-4 w-4" />
                  Analyze as Guest
                </ArrowButton>
                <Button variant="secondary" className="min-w-60" onClick={onNavigateToAuth}>
                  <User className="h-4 w-4" />
                  Professional Login / Sign Up
                </Button>
              </div>
            </div>

            <div className="relative min-h-[390px]">
              <MedicalKidneyVisual className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 opacity-95 sm:h-[350px] sm:w-[350px] lg:left-[42%] lg:h-[370px] lg:w-[370px]" />
              <div className="absolute bottom-8 right-3 w-[58%] max-w-[235px] rounded-2xl border border-blue-300 bg-[#06172d] p-2 shadow-[0_20px_46px_rgba(37,99,235,0.24)] sm:right-14 lg:bottom-10 lg:right-10">
                <div className="relative overflow-hidden rounded-xl border border-blue-400/40 bg-black">
                  <img src={ultrasoundPreview} alt="Renal ultrasound preview" className="h-32 w-full object-cover opacity-95" />
                  <div className="scan-line absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-blue-300/30 to-transparent" />
                  <div className="absolute right-2 top-2 rounded-full border border-emerald-200 bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)]">
                    96.8%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section id="results" className="scroll-reveal mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <Card className="grid gap-0 overflow-hidden md:grid-cols-3 lg:grid-cols-5">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-4 border-blue-100 p-5 md:border-r last:border-r-0">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-blue-200 bg-blue-100/70 text-[#2563eb]">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#0f56b3]">{value}</div>
                  <p className="mt-1 text-sm leading-5 text-[#37609d]">{label}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>

        {/* Features */}
        <section id="features" className="scroll-reveal mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <SectionEyebrow>Key Features</SectionEyebrow>
          <h2 className="mt-1 text-3xl font-extrabold text-[#0f3f88]">Our Core Features</h2>
          <p className="mt-1 text-sm text-[#37609d]">Everything you need for fast, accurate and secure kidney stone detection.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {features.map(({ icon: Icon, title, text }, index) => (
              <Card
                key={title}
                className="reveal-item p-7 transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(37,99,235,0.12)]"
                style={{ transitionDelay: `${index * 90}ms` } as CSSProperties}
              >
                <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-[#2563eb]">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-extrabold text-[#0f3f88]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#37609d]">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="about" className="scroll-reveal mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <SectionEyebrow>How It Works</SectionEyebrow>
          <h2 className="mt-1 max-w-xl text-3xl font-extrabold leading-tight text-[#0f3f88]">From Scan to Answer in 3 Simple Steps</h2>
          <Card className="mt-6 grid gap-4 p-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
            {workflowSteps.map(({ number, icon: Icon, title, text }, index) => (
              <div key={title} className="contents">
                <div className="flex items-center gap-5 rounded-lg bg-blue-50/60 p-4 lg:bg-transparent">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0f6bdc] text-sm font-extrabold text-white">{number}</span>
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-blue-200 bg-blue-100 text-[#2563eb]">
                    <Icon className="h-8 w-8" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-[#0f3f88]">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#37609d]">{text}</p>
                  </div>
                </div>
                {index < 2 ? <ArrowRight className="mx-auto hidden h-6 w-6 text-[#2563eb] lg:block" /> : null}
              </div>
            ))}
          </Card>
        </section>

        {/* Team */}
        <section id="team" className="scroll-reveal mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <SectionEyebrow>Our Team</SectionEyebrow>
          <h2 className="mt-1 text-3xl font-extrabold text-[#0f3f88]">Our Creators</h2>
          <p className="mt-1 text-sm text-[#37609d]">A small team with a big vision: better diagnostics for a healthier tomorrow.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {creators.map(({ name, role, github, kaggle, instagram }) => (
              <Card key={name} className="flex items-center gap-5 p-6">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-blue-200 bg-blue-100 text-blue-300">
                  <User className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0f3f88]">{name}</h3>
                  <p className="mt-1 text-sm text-[#37609d]">{role}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 transition-transform hover:scale-110"
                      aria-label={`${name}'s Instagram`}
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                    <a
                      href={kaggle}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-transform hover:scale-110"
                      aria-label={`${name}'s Kaggle profile`}
                    >
                      <KaggleIcon />
                    </a>
                    <a
                      href={github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0f3f88] transition-transform hover:scale-110"
                      aria-label={`${name}'s GitHub profile`}
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Why KidneyVision AI */}
        <section id="why-us" className="scroll-reveal mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div>
            <SectionEyebrow>Why KidneyVision AI?</SectionEyebrow>
            <h2 className="mt-1 text-3xl font-extrabold text-[#0f3f88]">Why Choose KidneyVision AI?</h2>
            <p className="mt-1 text-sm text-[#37609d]">Built with modern technology and real medical imaging project data.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {benefits.map(({ icon: Icon, title, text }) => (
                <Card key={title} className="flex gap-4 p-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-100 text-[#2563eb]">
                    <Icon className="h-7 w-7" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-[#0f3f88]">{title}</h3>
                    <p className="mt-1 text-sm leading-5 text-[#37609d]">{text}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="scroll-reveal relative overflow-hidden border-y border-blue-100 bg-gradient-to-r from-[#f5fbff] via-white to-[#dff0ff]">
          <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-10 lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div>
              <SectionEyebrow>Ready to try?</SectionEyebrow>
              <h2 className="mt-1 text-3xl font-extrabold text-[#0f3f88]">Start Your Analysis Today</h2>
              <p className="mt-2 text-[#37609d]">Choose how you want to use KidneyVision AI.</p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <ArrowButton onClick={onEnterPortalDirectly}><User className="h-4 w-4" />Analyze as Guest</ArrowButton>
                <Button variant="secondary" onClick={onNavigateToAuth}><User className="h-4 w-4" />Professional Login / Sign Up</Button>
              </div>
            </div>
            <div className="relative flex h-56 items-center justify-end gap-1 overflow-visible pr-2 sm:gap-4 sm:pr-8">
              <MedicalKidneyVisual className="cta-kidney h-36 w-36 opacity-80 sm:h-44 sm:w-44" imageClassName="scale-95" />
              <div className="rotate-[-9deg] text-2xl font-bold italic leading-tight text-[#2563eb]">Better<br />Diagnostics<br />Healthier<br />Tomorrow</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#082447] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-4 lg:px-8">
          <div>
            <Brand light />
          </div>
          <div>
            <h3 className="font-bold">Quick Links</h3>
            <div className="mt-3 grid gap-2 text-sm text-blue-100">
              {["Home", "About", "Features", "Why Us"].map((item) => (
                <button key={item} onClick={() => scrollToSection(item)} className="w-fit text-left transition hover:text-white">
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold">Support</h3>
            <div className="mt-3 grid gap-2 text-sm text-blue-100">
              <a className="w-fit transition hover:text-white" href="mailto:support@kidneyvision.ai">
                Contact Us
              </a>
              <button onClick={() => onNavigateToInfo?.("privacy")} className="w-fit text-left transition hover:text-white">
                Privacy Policy
              </button>
              <button onClick={() => onNavigateToInfo?.("terms")} className="w-fit text-left transition hover:text-white">
                Terms of Service
              </button>
            </div>
          </div>
          <div>
            <h3 className="font-bold">Contact Info</h3>
            <div className="mt-3 grid gap-2 text-sm text-blue-100">
              <a href="mailto:support@kidneyvision.ai" className="transition hover:text-white">support@kidneyvision.ai</a>
              <span>Tanger, Morocco</span>
              <span className="flex items-center gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-pink-400 hover:text-pink-300">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://kaggle.com" target="_blank" rel="noopener noreferrer" aria-label="Kaggle" className="text-sky-300 hover:text-white">
                  <KaggleIcon className="h-5 w-5" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-slate-300 hover:text-white">
                  <Github className="h-5 w-5" />
                </a>
              </span>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-blue-300/30 px-5 py-5 text-xs text-blue-100 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>Copyright 2026 KidneyVision AI. All rights reserved.</span>
          <LockKeyhole className="h-4 w-4" />
        </div>
      </footer>
    </div>
  );
}
