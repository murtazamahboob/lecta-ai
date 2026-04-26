import { useEffect, useState } from "react";
import { BookOpen, Brain, FileText, Lightbulb, GraduationCap, Sparkles, PenTool, Notebook } from "lucide-react";

const TIPS = [
  { icon: Brain, title: "Active Recall", text: "Try to retrieve information without looking — it strengthens memory pathways." },
  { icon: BookOpen, title: "Spaced Repetition", text: "Review notes at increasing intervals: 1 day, 3 days, 1 week." },
  { icon: Lightbulb, title: "Feynman Technique", text: "Explain a concept in simple words — gaps reveal what you don't know." },
  { icon: PenTool, title: "Handwrite Key Ideas", text: "Writing by hand boosts retention 30% more than typing." },
  { icon: GraduationCap, title: "Pomodoro Power", text: "25 min focus, 5 min break. Repeat. Your brain loves rhythm." },
  { icon: Notebook, title: "Cornell Method", text: "Split notes: cues | notes | summary. Review in under 5 minutes." },
  { icon: FileText, title: "Mind Maps Win", text: "Visual links between concepts cement long-term understanding." },
  { icon: Sparkles, title: "Teach to Learn", text: "Explaining to others is the fastest path to mastery." },
];

const STAGES = [
  "🎧 Transcribing your audio…",
  "🧠 Analyzing key concepts…",
  "🌐 Researching context from the web…",
  "📝 Structuring exam-ready notes…",
  "❓ Generating practice questions…",
  "📄 Polishing your PDF…",
];

const TOTAL_SECONDS = 30;
const STORAGE_KEY = "lecta_overlay_start";

export const startOverlayTimer = () => {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
  window.dispatchEvent(new Event("lecta-overlay-change"));
};

export const stopOverlayTimer = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("lecta-overlay-change"));
};

const getElapsed = () => {
  const start = Number(localStorage.getItem(STORAGE_KEY) || 0);
  if (!start) return -1;
  return Math.floor((Date.now() - start) / 1000);
};

export default function StudyLoadingOverlay({ onComplete }: { onComplete?: () => void }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, getElapsed()));
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const tick = () => {
      const elapsed = getElapsed();
      if (elapsed < 0) return;
      const s = Math.min(elapsed, TOTAL_SECONDS);
      setSeconds(s);
      if (s >= TOTAL_SECONDS) onComplete?.();
    };
    tick();
    const t = setInterval(tick, 1000);
    const tipT = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 5000);
    return () => {
      clearInterval(t);
      clearInterval(tipT);
    };
  }, [onComplete]);

  const progress = (seconds / TOTAL_SECONDS) * 100;
  const stage = STAGES[Math.min(Math.floor((seconds / TOTAL_SECONDS) * STAGES.length), STAGES.length - 1)];
  const remaining = TOTAL_SECONDS - seconds;
  const Tip = TIPS[tipIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md animate-fade-in p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-primary/30 bg-card/90 shadow-glow p-8 overflow-hidden">
        {/* Floating ambient icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[BookOpen, Brain, FileText, Lightbulb, GraduationCap, Notebook].map((Icon, i) => (
            <Icon
              key={i}
              className="absolute text-primary/15"
              style={{
                top: `${10 + (i * 17) % 80}%`,
                left: `${5 + (i * 23) % 90}%`,
                width: 28 + (i % 3) * 8,
                height: 28 + (i % 3) * 8,
                animation: `floatY ${4 + i}s ease-in-out ${i * 0.4}s infinite alternate`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes floatY {
            0% { transform: translateY(0) rotate(-4deg); }
            100% { transform: translateY(-18px) rotate(4deg); }
          }
          @keyframes orbitSpin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Center animation */}
        <div className="relative flex flex-col items-center text-center">
          <div className="relative h-32 w-32 mb-6">
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary/40"
              style={{ animation: "orbitSpin 8s linear infinite" }}
            />
            <div
              className="absolute inset-3 rounded-full border-2 border-dashed border-accent/40"
              style={{ animation: "orbitSpin 6s linear infinite reverse" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-btn-pulse">
                <Brain className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Crafting your notes…
          </h2>
          <p className="text-sm text-muted-foreground mt-1 transition-all duration-500" key={stage}>
            {stage}
          </p>

          {/* Progress bar */}
          <div className="w-full mt-6">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full gradient-primary rounded-full transition-all duration-1000 ease-linear shadow-glow"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
              <span>{Math.floor(progress)}%</span>
              <span>~{remaining}s remaining</span>
            </div>
          </div>

          {/* Study tip card */}
          <div
            key={tipIdx}
            className="mt-6 w-full rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left animate-float-up"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Study Tip
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Tip.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{Tip.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{Tip.text}</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/70 mt-5">
            Hang tight — your PDF will land in your inbox shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
