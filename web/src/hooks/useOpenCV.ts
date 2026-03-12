import { useState, useEffect } from "react";

export function useOpenCV() {
  const [ready, setReady] = useState(false)

    useEffect(() => {
        if ((window as any).cv?.Mat) return setReady(true);

        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.onload = () => {
            (window as any).cv['onRuntimeInitialized'] = () => 
                setReady(true);
            };
        document.body.appendChild(script);
    }, [])

    return { cv: (window as any).cv, ready };
}

