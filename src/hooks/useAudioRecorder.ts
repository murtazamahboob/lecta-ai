import { useState, useRef, useCallback, useEffect } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorder.current = recorder;
    chunks.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setIsRecording(true);
    setSeconds(0);
    setAudioBlob(null);
    setAudioUrl(null);

    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
    if (timer.current) clearInterval(timer.current);
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setSeconds(0);
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return { isRecording, seconds, audioBlob, audioUrl, startRecording, stopRecording, clearRecording };
}
