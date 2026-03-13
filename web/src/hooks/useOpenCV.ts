import { useState, useEffect, useRef } from "react";

export function useOpenCV() {
  const [ready,    setReady]    = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Already loaded from a previous mount
    if ((window as any).cv?.getBuildInformation) {
      setProgress(100);
      setReady(true);
      return;
    }

    // Animate 0 → 85% while the script loads
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) { clearInterval(timerRef.current!); return 85; }
        return Math.min(85, prev + (prev < 40 ? 3 : prev < 70 ? 1.5 : 0.5));
      });
    }, 150);

    const script = document.createElement("script");
    script.src   = "/opencv.js";   // served from public/, parsed off main thread
    script.async = true;

    script.onload = () => {
      clearInterval(timerRef.current!);
      setProgress(92);
      (window as any).cv["onRuntimeInitialized"] = () => {
        setProgress(100);
        setReady(true);
      };
    };

    script.onerror = () => {
      clearInterval(timerRef.current!);
      setProgress(-1);
    };

    document.body.appendChild(script);
    return () => { clearInterval(timerRef.current!); };
  }, []);

  return { cv: (window as any).cv as any, ready, progress };
}
