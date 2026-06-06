'use client';

import { useState, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalResult: (text: string) => void;
}

export type MicStatus =
  | 'idle'
  | 'requesting'   // asking for mic permission
  | 'listening'    // actively recording
  | 'error';

export function useSpeechRecognition({ onFinalResult }: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wantsRecording = useRef(false);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);  // kept alive while recording
  const onFinalResultRef = useRef(onFinalResult);
  onFinalResultRef.current = onFinalResult;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startSession = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || !wantsRecording.current) return;

    const r = new SR();
    r.continuous = false;
    r.interimResults = true;

    r.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        wantsRecording.current = false;
        setStatus('error');
        setError('Доступ до мікрофона відхилено. Налаштування → Safari → Мікрофон → Дозволити.');
        stopStream();
      }
      // 'no-speech' / 'aborted' are normal — let onend restart
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

    r.onstart = () => setStatus('listening');

    r.onend = () => {
      setInterim('');
      if (wantsRecording.current) {
        // iOS ends every session after a pause — restart after brief delay
        setTimeout(() => {
          if (wantsRecording.current) startSession();
        }, 150);
      } else {
        setStatus('idle');
        stopStream();
      }
    };

    recognitionRef.current = r;
    try { r.start(); } catch (e) {
      console.error('r.start() failed', e);
      wantsRecording.current = false;
      setStatus('error');
      setError('Не вдалося запустити мікрофон — спробуй ще раз.');
      stopStream();
    }
  }, [stopStream]);

  const start = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Web Speech API не підтримується. Потрібен Safari 14.5+ або Chrome.');
      setStatus('error');
      return;
    }

    setError(null);
    setStatus('requesting');

    // iOS Safari requires getUserMedia to show the permission dialog
    // AND we keep the stream alive — closing it can freeze recognition on iOS
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;           // keep alive!
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setError(denied
        ? 'Доступ до мікрофона відхилено. Налаштування → Safari → Мікрофон → Дозволити.'
        : `Помилка мікрофона: ${err?.message ?? err}`);
      setStatus('error');
      return;
    }

    wantsRecording.current = true;
    startSession();
  }, [startSession]);

  const stop = useCallback(() => {
    wantsRecording.current = false;
    recognitionRef.current?.stop();
    setStatus('idle');
    setInterim('');
    stopStream();
  }, [stopStream]);

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
