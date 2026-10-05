import { useNavigate } from "react-router-dom";
import { Home, User } from "lucide-react";
import { Brand } from "./common/Brand";
import { Button, Card, SectionEyebrow } from "./common/UI";

const sections = [
  ["Intended Use", "KidneyVision AI is a web-based platform that uses deep learning to assist in the detection of kidney stones from ultrasound images. It is designed as a clinical decision-support tool and does not provide definitive medical diagnosis."],
  ["Professional Review", "All AI-generated predictions, confidence scores, and classification outputs must be reviewed and validated by a qualified medical professional before being used in any patient-care decision. The system serves as a second opinion, not a replacement for clinical expertise."],
  ["Accuracy Disclaimer", "While the AI model has been trained on over 9,400 CT images and achieves high accuracy in controlled evaluations, performance may vary with images from different scanners, protocols, or patient demographics. Users should exercise clinical judgment in interpreting results."],
  ["Service & Data", "Analysis history, reports, and patient records are stored securely for authenticated professional users. The platform reserves the right to update, modify, or temporarily suspend services for maintenance or improvements. Users are responsible for maintaining the confidentiality of their account credentials."],
];

export default function TermsPage() {
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
        <SectionEyebrow>Terms</SectionEyebrow>
        <h1 className="mt-2 text-4xl font-extrabold text-[#0f3f88]">Terms of Service</h1>
        <p className="mt-4 leading-7 text-[#37609d]">
          Terms and conditions governing your use of the KidneyVision AI platform.
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
