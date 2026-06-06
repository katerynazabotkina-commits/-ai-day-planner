'use client';

import { useState, useRef, useCallback } from 'react';

interface Options {
  onFinalResult: (text: string) => void;
}

export function useSpeechRecognition({ onFinalResult }: Options) {
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim]         = useState('');
  const [error, setError]             = useState<string | null>(null);

  const wantsOn        = useRef(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef    = useRef(onFinalResult);
  onResultRef.current  = onFinalResult;

  const startSession = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || !wantsOn.current) return;

    const r      = new SR();
    r.lang           = 'uk-UA';
    r.continuous     = false;   // iOS ignores true
    r.interimResults = true;

    r.onstart = () => { setIsRecording(true); setError(null); };

    r.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        wantsOn.current = false;
        setIsRecording(false);
        setError('Дозволь мікрофон у браузері та спробуй ще раз.');
      }
      // 'no-speech' / 'aborted' — let onend restart
    };

    r.onresult = (e: any) => {
      let fin = '', tmp = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        e.results[i].isFinal
          ? (fin += e.results[i][0].transcript.trim())
          : (tmp += e.results[i][0].transcript);
      }
      if (fin) { onResultRef.current(fin); setInterim(''); }
      else      setInterim(tmp);
    };

    r.onend = () => {
      setInterim('');
      if (wantsOn.current) {
        // iOS ends after each utterance — auto-restart
        setTimeout(() => { if (wantsOn.current) startSession(); }, 100);
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = r;
    try { r.start(); }
    catch {
      wantsOn.current = false;
      setIsRecording(false);
      setError('Не вдалося запустити мікрофон.');
    }
  }, []);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Голосовий ввід не підтримується у цьому браузері.');
      return;
    }
    setError(null);
    wantsOn.current = true;
    startSession();           // let browser ask for permission itself
  }, [startSession]);

  const stop = useCallback(() => {
    wantsOn.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterim('');
  }, []);

  const toggle = useCallback(() => {
    wantsOn.current ? stop() : start();
  }, [start, stop]);

  return { isRecording, interim, error, toggle };
}
