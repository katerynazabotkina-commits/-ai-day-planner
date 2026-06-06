'use client';

import { useState, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalResult: (text: string) => void;
}

export type MicStatus = 'idle' | 'requesting' | 'listening' | 'error';

export function useSpeechRecognition({ onFinalResult }: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

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
        setError('Доступ відхилено. Налаштування → Safari → Мікрофон → Дозволити.');
      }
      // 'no-speech' / 'aborted' are normal — onend will restart
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
        // iOS ends every utterance — restart after a short gap
        setTimeout(() => { if (wantsRecording.current) startSession(); }, 200);
      } else {
        setStatus('idle');
      }
    };

    recognitionRef.current = r;
    try {
      r.start();
    } catch (err) {
      wantsRecording.current = false;
      setStatus('error');
      setError('Не вдалося запустити мікрофон — спробуй ще раз.');
    }
  }, []);

  const start = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Потрібен Safari 14.5+ або Chrome.');
      setStatus('error');
      return;
    }

    setError(null);
    setStatus('requesting');

    // Ask for mic permission via getUserMedia, then IMMEDIATELY release —
    // on iOS, keeping the stream open blocks SpeechRecognition from the mic.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // release right away
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setError(denied
        ? 'Доступ відхилено. Налаштування → Safari → Мікрофон → Дозволити.'
        : `Помилка мікрофона: ${err?.message ?? err}`);
      setStatus('error');
      return;
    }

    // Small pause so iOS fully releases the mic before SpeechRecognition takes it
    await new Promise(resolve => setTimeout(resolve, 300));

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
    isRecording: status === 'listening' || status === 'requesting',
    isRequesting: status === 'requesting',
    interim,
    error,
    toggle,
    status,
  };
}
