import { useNavigate } from "react-router-dom";
import { Home, User } from "lucide-react";
import { Brand } from "./common/Brand";
import { Button, Card, SectionEyebrow } from "./common/UI";

const sections = [
  ["Information Handling", "KidneyVision AI processes uploaded ultrasound images through a secure pipeline. Guest images are analyzed in real-time and are not permanently stored. Professional account data is encrypted and stored in compliance with medical data handling standards."],
  ["Medical Data", "All medical imaging data is transmitted over encrypted connections (TLS/SSL). Access controls, audit logs, and retention policies are implemented to protect patient data throughout the analysis workflow. Images are processed server-side and results are returned securely."],
  ["User Accounts", "Professional accounts require email verification. Passwords are hashed using industry-standard algorithms. Session tokens are managed via Laravel Sanctum with configurable expiration. Users can request account deletion at any time."],
  ["Data Retention", "Guest analysis results are session-based and not persisted. Professional users' analysis history and reports are stored securely in the database and can be deleted by the user or administrator. All data handling follows HIPAA-compliant design patterns."],
];

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      <header className="border-b border-blue-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <button onClick={() => navigate("/")} aria-label="Go to home">
            <Brand />
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button variant="secondary" onClick={() => navigate("/login")}>
              <User className="h-4 w-4" />
              Login
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12">
        <SectionEyebrow>Privacy</SectionEyebrow>
        <h1 className="mt-2 text-4xl font-extrabold text-[#0f3f88]">Privacy Policy</h1>
        <p className="mt-4 leading-7 text-[#37609d]">
          How KidneyVision AI handles your data and protects your privacy.
        </p>
        <Card className="mt-8 divide-y divide-blue-100">
          {sections.map(([title, text]) => (
            <section key={title} className="p-6">
              <h2 className="text-xl font-extrabold text-[#0f3f88]">{title}</h2>
              <p className="mt-3 leading-7 text-[#37609d]">{text}</p>
            </section>
          ))}
        </Card>
        <p className="mt-6 rounded-lg border border-blue-200 bg-white p-4 text-sm font-semibold text-[#37609d]">
          This tool provides preliminary AI-assisted analysis and is not a substitute for professional medical consultation.
        </p>
      </main>
    </div>
  );
}
