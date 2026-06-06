'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalResult: (text: string) => void;
}

export type MicStatus = 'idle' | 'requesting' | 'listening' | 'error';

// Detect iOS once on the client
function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function useSpeechRecognition({ onFinalResult }: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => { setIsIOS(detectIOS()); }, []);

  const wantsRecording = useRef(false);
  const recognitionRef = useRef<any>(null);
  const onFinalResultRef = useRef(onFinalResult);
  onFinalResultRef.current = onFinalResult;

  const startSession = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || !wantsRecording.current) return;

    const r = new SR();
    r.lang = 'uk-UA';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => setStatus('listening');

    r.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        wantsRecording.current = false;
        setStatus('error');
        setError('Доступ відхилено.');
      }
    };

    r.onresult = (e: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript.trim();
        else interimText += res[0].transcript;
      }
      if (finalText) { onFinalResultRef.current(finalText); setInterim(''); }
      else setInterim(interimText);
    };

    r.onend = () => {
      setInterim('');
      if (wantsRecording.current) {
        setTimeout(() => { if (wantsRecording.current) startSession(); }, 200);
      } else {
        setStatus('idle');
      }
    };

    recognitionRef.current = r;
    try { r.start(); } catch {
      wantsRecording.current = false;
      setStatus('error');
      setError('Не вдалося запустити мікрофон.');
    }
  }, []);

  const start = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Потрібен Chrome або Firefox.'); setStatus('error'); return; }

    setError(null);
    setStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError';
      setError(denied ? 'Доступ відхилено.' : `Помилка: ${err?.message}`);
      setStatus('error');
      return;
    }

    await new Promise(r => setTimeout(r, 300));
    wantsRecording.current = true;
    startSession();
  }, [startSession]);

  const stop = useCallback(() => {
    wantsRecording.current = false;
    recognitionRef.current?.stop();
    setStatus('idle');
    setInterim('');
  }, []);

  const toggle = useCallback(() => {
    if (wantsRecording.current) stop(); else start();
  }, [start, stop]);

  return {
    isIOS,
    isRecording: status === 'listening' || status === 'requesting',
    isRequesting: status === 'requesting',
    interim,
    error,
    toggle,
    status,
  };
}
