'use client';

import { useState, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalResult: (text: string) => void;
}

export function useSpeechRecognition({ onFinalResult }: UseSpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    r.continuous = false;      // iOS Safari ignores true
    r.interimResults = true;

    r.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        wantsRecording.current = false;
        setIsRecording(false);
        setError('Доступ до мікрофона відхилено. Дозволь у налаштуваннях браузера → Safari → Мікрофон.');
      }
      // 'no-speech' and 'aborted' are normal — onend will handle restart
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

    // iOS ends the session after each pause → restart automatically
    r.onend = () => {
      setInterim('');
      if (wantsRecording.current) {
        try {
          const next = createSession();
          if (next) { recognitionRef.current = next; next.start(); }
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

  const start = useCallback(async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Голосовий ввід не підтримується. Спробуй Safari або Chrome.');
      return;
    }

    setError(null);

    // iOS Safari needs an explicit getUserMedia call to show the
    // microphone permission dialog before SpeechRecognition will work.
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // just needed the permission
      } catch {
        setError('Доступ до мікрофона відхилено. Дозволь у налаштуваннях браузера → Safari → Мікрофон.');
        return;
      }
    }

    wantsRecording.current = true;
    setIsRecording(true);

    const r = createSession();
    if (!r) return;
    recognitionRef.current = r;
    try {
      r.start();
    } catch {
      wantsRecording.current = false;
      setIsRecording(false);
      setError('Не вдалося запустити мікрофон. Спробуй ще раз.');
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
