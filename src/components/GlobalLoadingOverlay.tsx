import { useEffect, useState } from "react";
import StudyLoadingOverlay, { stopOverlayTimer } from "./StudyLoadingOverlay";

const STORAGE_KEY = "lecta_overlay_start";
const TOTAL_SECONDS = 30;

export default function GlobalLoadingOverlay() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () => {
      const start = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (!start) {
        setActive(false);
        return;
      }
      const elapsed = Math.floor((Date.now() - start) / 1000);
      if (elapsed >= TOTAL_SECONDS) {
        stopOverlayTimer();
        setActive(false);
      } else {
        setActive(true);
      }
    };
    check();
    const onChange = () => check();
    window.addEventListener("lecta-overlay-change", onChange);
    window.addEventListener("storage", onChange);
    const i = setInterval(check, 1000);
    return () => {
      window.removeEventListener("lecta-overlay-change", onChange);
      window.removeEventListener("storage", onChange);
      clearInterval(i);
    };
  }, []);

  if (!active) return null;
  return <StudyLoadingOverlay onComplete={() => { stopOverlayTimer(); setActive(false); }} />;
}