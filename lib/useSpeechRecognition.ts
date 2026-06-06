'use client';

import { useState, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalResult: (text: string) => void;
}

export function useSpeechRecognition({ onFinalResult }: UseSpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Ref tracks whether the user wants recording ON — survives across
  // recognition sessions (iOS Safari kills each session after a pause).
  const wantsRecording = useRef(false);
  const recognitionRef = useRef<any>(null);
  const onFinalResultRef = useRef(onFinalResult);
  onFinalResultRef.current = onFinalResult;

  const createSession = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const r = new SpeechRecognition();
    r.lang = 'uk-UA';
    // iOS Safari ignores continuous:true — we restart manually in onend instead.
    r.continuous = false;
    r.interimResults = true;

    r.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        wantsRecording.current = false;
        setIsRecording(false);
        setError('Доступ до мікрофона відхилено. Дозволь у налаштуваннях браузера.');
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(`Помилка: ${e.error}`);
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
      if (finalText) {
        onFinalResultRef.current(finalText);
        setInterim('');
      } else {
        setInterim(interimText);
      }
    };

    // When a session ends, restart it automatically if user hasn't stopped.
    r.onend = () => {
      setInterim('');
      if (wantsRecording.current) {
        try {
          const next = createSession();
          if (next) {
            recognitionRef.current = next;
            next.start();
          }
        } catch {
          wantsRecording.current = false;
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };

    return r;
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Голосовий ввід не підтримується цим браузером. Спробуй Chrome або Safari.');
      return;
    }

    setError(null);
    wantsRecording.current = true;
    setIsRecording(true);

    const r = createSession();
    if (r) {
      recognitionRef.current = r;
      r.start();
    }
  }, [createSession]);

  const stop = useCallback(() => {
    wantsRecording.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterim('');
  }, []);

  const toggle = useCallback(() => {
    if (wantsRecording.current) stop(); else start();
  }, [start, stop]);

  return { isRecording, interim, error, toggle };
}
