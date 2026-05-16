import { useState, useRef } from "react";
import { Upload, Send, Loader2, CheckCircle2, AlertCircle, Mic, FileAudio, Sparkles, FlaskConical, Rocket } from "lucide-react";
import AudioRecorderCard from "./AudioRecorderCard";
import EmailTagsInput from "./EmailTagsInput";
import StudyLoadingOverlay from "./StudyLoadingOverlay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ACCEPTED = ".mp3,.wav,.webm";

type Status = "idle" | "loading" | "success" | "error";

export default function LectureUploadForm() {
  const { user, isAdmin } = useAuth();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [weakPoints, setWeakPoints] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [sendAnimation, setSendAnimation] = useState(false);
  const [mode, setMode] = useState<"prod" | "test">("prod");
  const [showOverlay, setShowOverlay] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const requestDoneRef = useRef(false);

  const audioReady = tab === "record" ? !!audioBlob : !!uploadedFile;
  const canSubmit = audioReady && emails.length > 0 && subject.trim().length > 0 && status !== "loading";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadedFile(file);
  };

  const handleSubmit = async () => {
    setSendAnimation(true);
    setStatus("loading");
    setRequestDone(false);
    requestDoneRef.current = false;
    setShowOverlay(true);
    try {
      const formData = new FormData();
      if (tab === "record" && audioBlob) {
        formData.append("audio", audioBlob, "recording.webm");
      } else if (uploadedFile) {
        formData.append("audio", uploadedFile);
      }
      formData.append("subject", subject.trim());
      formData.append("emails", emails.join(","));
      formData.append("weak_points", weakPoints.trim());

      formData.append("mode", isAdmin && mode === "test" ? "test" : "prod");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lecture-webhook`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Request failed");

      if (user) {
        const audioName = tab === "record" ? "recording.webm" : (uploadedFile?.name || "upload");
        await supabase.from("submissions").insert({
          user_id: user.id,
          subject: subject.trim(),
          emails: emails.join(","),
          audio_filename: audioName,
          weak_points: weakPoints.trim(),
          status: isAdmin && mode === "test" ? "test" : "sent",
        });
      }

      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setTimeout(() => setSendAnimation(false), 600);
      setRequestDone(true);
      requestDoneRef.current = true;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-float-up">
      {showOverlay && (
        <StudyLoadingOverlay
          onComplete={() => {
            if (requestDoneRef.current) setShowOverlay(false);
            else {
              const check = setInterval(() => {
                if (requestDoneRef.current) {
                  clearInterval(check);
                  setShowOverlay(false);
                }
              }, 500);
            }
          }}
        />
      )}
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-primary shadow-glow mb-4 transition-transform duration-300 hover:scale-110 hover:rotate-3">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="text-2xl font-extrabold text-foreground tracking-tight">Lecta.ai</div>
        <p className="text-sm text-muted-foreground mt-1">Audio to smart notes, instantly</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-6 transition-all duration-300 hover:shadow-glow">
        {/* Admin-only mode toggle */}
        {isAdmin && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Admin · Webhook Mode</span>
              <span className={`text-xs font-bold ${mode === "test" ? "text-yellow-500" : "text-green-500"}`}>
                {mode === "test" ? "TEST" : "PRODUCTION"}
              </span>
            </div>
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setMode("prod")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                  mode === "prod" ? "gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Rocket className="h-3.5 w-3.5" />
                Production
              </button>
              <button
                type="button"
                onClick={() => setMode("test")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                  mode === "test" ? "bg-yellow-500/20 text-yellow-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Test
              </button>
            </div>
          </div>
        )}

        {/* Audio source tabs */}
        <div className="flex rounded-lg bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab("record")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              tab === "record" ? "gradient-primary text-primary-foreground shadow-sm scale-[1.02]" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Mic className="h-4 w-4" />
            Record
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              tab === "upload" ? "gradient-primary text-primary-foreground shadow-sm scale-[1.02]" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>

        {/* Record tab */}
        {tab === "record" && (
          <div className="animate-float-up">
            <AudioRecorderCard onAudioReady={setAudioBlob} />
          </div>
        )}

        {/* Upload tab */}
        {tab === "upload" && (
          <div className="space-y-3 animate-float-up">
            <label className="block text-sm font-medium text-foreground">Upload Audio File</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all duration-300 hover:shadow-glow/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              <FileAudio className="h-8 w-8" />
              <span className="text-sm">{uploadedFile ? uploadedFile.name : "Click to select audio file"}</span>
              <span className="text-xs text-muted-foreground">MP3, WAV, or WebM</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Subject */}
        <div className="space-y-2 form-field-focus">
          <label htmlFor="subject" className="block text-sm font-medium text-foreground">
            Subject Name
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Operating Systems — Lecture 5"
            className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-300"
          />
        </div>

        {/* Weak Points */}
        <div className="space-y-2 form-field-focus">
          <label htmlFor="weakPoints" className="block text-sm font-medium text-foreground">
            Weak Points <span className="text-muted-foreground font-normal">(topics to focus on)</span>
          </label>
          <textarea
            id="weakPoints"
            value={weakPoints}
            onChange={(e) => setWeakPoints(e.target.value)}
            placeholder="e.g. I struggle with memory management and process scheduling…"
            rows={3}
            className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-300 resize-none"
          />
        </div>

        {/* Emails */}
        <EmailTagsInput emails={emails} onChange={setEmails} />

        {/* Submit */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`w-full flex items-center justify-center gap-2 rounded-lg gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 active:scale-[0.97] ${
            canSubmit && status === "idle" ? "animate-btn-pulse" : ""
          } ${sendAnimation ? "scale-95" : ""}`}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send to Recipients
            </>
          )}
        </button>

        {/* Status messages */}
        {status === "success" && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success-foreground animate-success-pop">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Lecture sent successfully!
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Something went wrong. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
