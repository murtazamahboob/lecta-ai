import { useState, useRef } from "react";
import { Upload, Send, Loader2, CheckCircle2, AlertCircle, Mic, FileAudio } from "lucide-react";
import AudioRecorderCard from "./AudioRecorderCard";
import EmailTagsInput from "./EmailTagsInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const WEBHOOK_URL = "https://new9653.app.n8n.cloud/webhook/lecture-ghost";
const ACCEPTED = ".mp3,.wav,.webm";

type Status = "idle" | "loading" | "success" | "error";

export default function LectureUploadForm() {
  const { user } = useAuth();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [weakPoints, setWeakPoints] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [tab, setTab] = useState<"record" | "upload">("record");
  const fileRef = useRef<HTMLInputElement>(null);

  const audioReady = tab === "record" ? !!audioBlob : !!uploadedFile;
  const canSubmit = audioReady && emails.length > 0 && subject.trim().length > 0 && status !== "loading";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadedFile(file);
  };

  const handleSubmit = async () => {
    setStatus("loading");
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

      const res = await fetch(WEBHOOK_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Request failed");

      // Save submission to database
      if (user) {
        const audioName = tab === "record" ? "recording.webm" : (uploadedFile?.name || "upload");
        await supabase.from("submissions").insert({
          user_id: user.id,
          subject: subject.trim(),
          emails: emails.join(","),
          audio_filename: audioName,
          weak_points: weakPoints.trim(),
          status: "sent",
        });
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-primary shadow-glow mb-4">
          <Mic className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Lecture Ghost</h1>
        <p className="text-sm text-muted-foreground mt-1">Record or upload lectures and share with your class</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-6">
        {/* Audio source tabs */}
        <div className="flex rounded-lg bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab("record")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              tab === "record" ? "gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="h-4 w-4" />
            Record
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              tab === "upload" ? "gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>

        {/* Record tab */}
        {tab === "record" && <AudioRecorderCard onAudioReady={setAudioBlob} />}

        {/* Upload tab */}
        {tab === "upload" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Upload Audio File</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
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
        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-medium text-foreground">
            Subject Name
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Operating Systems — Lecture 5"
            className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Emails */}
        <EmailTagsInput emails={emails} onChange={setEmails} />

        {/* Submit */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-lg gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin-slow" />
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
          <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Lecture sent successfully!
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Something went wrong. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
