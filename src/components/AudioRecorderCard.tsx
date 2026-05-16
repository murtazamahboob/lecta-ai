import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Mic, Square, Trash2 } from "lucide-react";

interface Props {
  onAudioReady: (blob: Blob | null) => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function AudioRecorderCard({ onAudioReady }: Props) {
  const { isRecording, seconds, audioBlob, audioUrl, startRecording, stopRecording, clearRecording } =
    useAudioRecorder();

  const handleStart = async () => {
    try {
      await startRecording();
    } catch {
      alert("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const handleStop = () => {
    stopRecording();
    // onAudioReady will be called via effect below
  };

  const handleClear = () => {
    clearRecording();
    onAudioReady(null);
  };

  // Notify parent when blob changes
  if (audioBlob) {
    // We call this synchronously on render after blob is set
    // Using a ref-based approach to avoid infinite loops
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">Record Audio</label>

      {!isRecording && !audioUrl && (
        <button
          type="button"
          onClick={handleStart}
          className="flex items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90 transition-all"
        >
          <Mic className="h-4 w-4" />
          Start Recording
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <span className="absolute h-10 w-10 rounded-full bg-destructive/40 animate-pulse-ring" />
            <span className="relative h-3 w-3 rounded-full bg-destructive" />
          </div>
          <span className="font-mono text-lg text-foreground tabular-nums">{formatTime(seconds)}</span>
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 transition-all"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </button>
        </div>
      )}

      {audioUrl && (
        <div className="flex items-center gap-3">
          <audio controls src={audioUrl} className="flex-1 h-10" onLoadedData={() => onAudioReady(audioBlob)} />
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear recording"
            className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
