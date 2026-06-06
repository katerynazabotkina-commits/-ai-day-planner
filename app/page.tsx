'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/lib/TaskContext';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import type { ParsedTask } from '@/app/api/parse/route';

type Status = 'idle' | 'parsing' | 'error';

export default function CapturePage() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [apiError, setApiError] = useState('');
  const [showKeyboardTip, setShowKeyboardTip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addParsedTasks } = useTasks();
  const router = useRouter();

  const appendText = useCallback((text: string) => {
    setInput(prev => {
      const trimmed = prev.trimEnd();
      return trimmed ? trimmed + '\n' + text : text;
    });
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }, []);

  const { isIOS, isRecording, isRequesting, interim, error: micError, toggle } = useSpeechRecognition({
    onFinalResult: appendText,
  });

  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);

  const handleMicPress = () => {
    if (isIOS) {
      // iOS keyboard mic is more reliable than Web Speech API
      textareaRef.current?.focus();
      setShowKeyboardTip(true);
      setTimeout(() => setShowKeyboardTip(false), 5000);
    } else {
      toggle();
    }
  };

  const handleParse = async () => {
    if (lines.length === 0) return;
    setStatus('parsing');
    setApiError('');

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dump: input.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const tasks: ParsedTask[] = await res.json();
      addParsedTasks(tasks);
      setInput('');
      router.push('/inbox');
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Помилка з\'єднання');
      setStatus('error');
    } finally {
      setStatus(s => s === 'parsing' ? 'idle' : s);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)]">
      <header className="px-5 pt-12 pb-3 flex-none">
        <h1 className="text-2xl font-bold text-gray-900">Що в голові?</h1>
        <p className="text-sm text-gray-400 mt-1">Пиши або диктуй — AI розбере на задачі</p>
      </header>

      <div className="flex-1 px-4 py-2 min-h-0">
        <div className="relative h-full">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); if (status === 'error') setStatus('idle'); }}
            disabled={status === 'parsing'}
            placeholder="Зустріч з Марком о 15:00&#10;Купити: молоко, яйця, хліб&#10;Позвонити лікарю&#10;Дописати звіт до п'ятниці..."
            className="w-full h-full min-h-64 text-base text-gray-800 placeholder-gray-300 bg-gray-50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-colors leading-relaxed disabled:opacity-60"
          />
          {interim && (
            <div className="absolute bottom-3 left-3 right-3 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 pointer-events-none">
              <p className="text-sm text-indigo-400 italic leading-snug">{interim}…</p>
            </div>
          )}
        </div>
      </div>

      {/* iOS keyboard mic tip */}
      {showKeyboardTip && (
        <div className="mx-4 mt-2 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex-none">
          <p className="text-sm text-indigo-700 font-medium">
            Натисни 🎤 на клавіатурі → говори → текст з'явиться тут
          </p>
        </div>
      )}

      {/* Non-iOS recording banners */}
      {!isIOS && isRequesting && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl flex-none">
          <span className="text-base">🎙️</span>
          <p className="text-sm text-amber-700 font-medium">Запит дозволу на мікрофон…</p>
        </div>
      )}
      {!isIOS && isRecording && !isRequesting && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl flex-none">
          <span className="relative flex h-3 w-3 flex-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <p className="text-sm text-red-600 font-medium">
            {interim ? interim + '…' : 'Слухаю… говори зараз'}
          </p>
        </div>
      )}

      {/* AI parsing banner */}
      {status === 'parsing' && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex-none">
          <span className="relative flex h-3 w-3 flex-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
          </span>
          <p className="text-sm text-indigo-600 font-medium">AI розбирає задачі…</p>
        </div>
      )}

      {micError && !isIOS && (
        <div className="mx-4 mt-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl flex-none">
          <p className="text-sm text-red-500">{micError}</p>
        </div>
      )}
      {status === 'error' && apiError && (
        <div className="mx-4 mt-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl flex-none">
          <p className="text-sm text-red-500">Помилка: {apiError}</p>
        </div>
      )}

      {lines.length > 0 && !isRecording && status === 'idle' && !showKeyboardTip && (
        <p className="px-5 mt-2 text-xs text-gray-400 flex-none">
          {lines.length} {lines.length === 1 ? 'думка' : lines.length < 5 ? 'думки' : 'думок'} → AI перетворить на задачі
        </p>
      )}

      <div className="px-4 pt-3 pb-4 flex items-center gap-3 flex-none">
        <button
          onClick={handleMicPress}
          disabled={status === 'parsing'}
          className={`relative flex-none w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
            !isIOS && isRecording
              ? 'bg-red-500 text-white shadow-red-200'
              : 'bg-gray-100 text-gray-500 active:bg-gray-200 disabled:opacity-40'
          }`}
          aria-label="Голосовий ввід"
        >
          {!isIOS && isRecording && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          )}
          <svg viewBox="0 0 24 24" fill={!isIOS && isRecording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6 relative">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>

        {!isIOS && isRecording ? (
          <button onClick={toggle} className="flex-1 h-14 bg-gray-800 text-white rounded-2xl font-semibold text-base transition-all active:scale-95">
            Зупинити запис
          </button>
        ) : (
          <button
            onClick={handleParse}
            disabled={lines.length === 0 || status === 'parsing'}
            className="flex-1 h-14 bg-indigo-600 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-2xl font-semibold text-base transition-all active:scale-95 active:bg-indigo-700 disabled:cursor-not-allowed"
          >
            {status === 'parsing' ? 'Аналізую…' : lines.length === 0 ? 'Введи думки вище' : `Розібрати з AI (${lines.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
