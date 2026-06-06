'use client';

import { useState, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onFinalResult: (text: string) => void;
  onInterimResult?: (text: string) => void;
}

export function useSpeechRecognition({ onFinalResult, onInterimResult }: UseSpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' &&
    (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  const start = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Голосовий ввід не підтримується цим браузером. Спробуй Chrome або Safari.');
      return;
    }

    setError(null);

    const recognition = new SpeechRecognition();
    recognition.lang = 'uk-UA';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setError('Доступ до мікрофона відхилено. Дозволь у налаштуваннях браузера.');
      } else if (e.error === 'no-speech') {
        setError(null);
      } else {
        setError(`Помилка мікрофона: ${e.error}`);
      }
      setIsRecording(false);
      setInterim('');
    };

    recognition.onresult = (e: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript.trim();
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        onFinalResult(finalText);
        setInterim('');
      } else {
        setInterim(interimText);
        onInterimResult?.(interimText);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onFinalResult, onInterimResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterim('');
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  }, [isRecording, start, stop]);

  return { isRecording, interim, error, isSupported, toggle, stop };
}
