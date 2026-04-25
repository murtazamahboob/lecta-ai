import LectureUploadForm from "@/components/LectureUploadForm";
import { Sparkles, Mic, Brain, Globe2, FileCheck2 } from "lucide-react";

export default function Index() {
  return (
    <main className="relative overflow-hidden">
      {/* Background grid + dots */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-60" />
      <div className="absolute top-24 right-8 w-32 h-32 dot-pattern opacity-70 pointer-events-none hidden md:block" />
      <div className="absolute top-1/3 left-8 w-24 h-24 dot-pattern opacity-50 pointer-events-none hidden md:block" />

      {/* Hero */}
      <section className="relative px-4 pt-16 pb-10 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-8 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Lecture Analyzer
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05]">
          Turn Any Lecture Into
          <br />
          <span className="gradient-hero">Exam-Ready Notes</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload or record your lecture audio. Get AI-analyzed notes, web research,
          exam questions, and a polished PDF — delivered to your inbox.
        </p>

        <p className="mt-6 text-xs text-muted-foreground/80">
          No credit card required &nbsp;·&nbsp; Free to try &nbsp;·&nbsp; PDF delivered in minutes
        </p>
      </section>

      {/* Form */}
      <section className="relative px-4 pb-16 flex justify-center">
        <LectureUploadForm />
      </section>

      {/* How it works */}
      <section className="relative px-4 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">How It Works</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Mic, title: "Audio Capture", desc: "Record live or upload MP3, WAV, WebM files instantly.", accent: "from-primary to-accent" },
            { icon: Brain, title: "AI Note Analysis", desc: "GPT structures your lecture into exam-ready sections.", accent: "from-accent to-primary-glow" },
            { icon: Globe2, title: "Web Research", desc: "Wikipedia + Tavily enrichment for every topic covered.", accent: "from-primary-glow to-primary" },
            { icon: FileCheck2, title: "Exam Preparation", desc: "Practice questions, hints & a quick revision checklist.", accent: "from-primary to-accent" },
          ].map((step, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 shadow-card hover:shadow-glow hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 left-5 right-5 h-[2px] rounded-full bg-gradient-to-r ${step.accent}`} />
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
                <step.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/70 mt-12">
          Powered by GPT &nbsp;·&nbsp; Groq Whisper &nbsp;·&nbsp; Wikipedia &nbsp;·&nbsp; Tavily &nbsp;·&nbsp; PDF Endpoint
        </p>
      </section>
    </main>
  );
}
