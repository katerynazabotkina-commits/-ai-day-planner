'use client';

import { useState, useRef, useCallback } from 'react';

interface Options {
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
}

export function useAudioRecorder({ onResult, onError }: Options) {
  const [isRecording,    setIsRecording]    = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mrRef     = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = useCallback(() => {
    mrRef.current?.stop();  // triggers onstop → transcribe
    setIsRecording(false);
  }, []);

  const start = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError?.('Дозволь доступ до мікрофона у браузері.');
      return;
    }

    // Pick a MIME type that works on the current browser/OS
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
      .find(t => MediaRecorder.isTypeSupported(t)) ?? '';

    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];

    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());

      const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
      if (blob.size < 1000) return; // too short — skip

      const ext = mr.mimeType?.includes('mp4') ? 'mp4'
                : mr.mimeType?.includes('ogg') ? 'ogg'
                : 'webm';

      setIsTranscribing(true);
      try {
        const fd = new FormData();
        fd.append('audio', blob, `rec.${ext}`);
        const res  = await fetch('/api/transcribe', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.text) onResultRef.current(data.text);
        else onError?.(data.error ?? 'Не вдалося розпізнати');
      } catch {
        onError?.('Помилка з\'єднання з сервером.');
      } finally {
        setIsTranscribing(false);
      }
    };

    mrRef.current = mr;
    mr.start(250); // collect chunks every 250ms
    setIsRecording(true);
  }, [onError]);

  const toggle = useCallback(() => {
    isRecording ? stop() : start();
  }, [isRecording, start, stop]);

  return { isRecording, isTranscribing, toggle };
}
