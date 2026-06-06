'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/lib/TaskContext';
import { useAudioRecorder } from '@/lib/useAudioRecorder';
import type { ParsedTask } from '@/app/api/parse/route';

type ParseStatus = 'idle' | 'parsing' | 'error';

export default function CapturePage() {
  const [input, setInput]       = useState('');
  const [parseStatus, setPS]    = useState<ParseStatus>('idle');
  const [apiError, setApiError] = useState('');
  const [micError, setMicError] = useState('');
  const textareaRef             = useRef<HTMLTextAreaElement>(null);
  const { addParsedTasks }      = useTasks();
  const router                  = useRouter();

  const appendText = useCallback((text: string) => {
    setInput(prev => {
      const base = prev.trimEnd();
      return base ? base + '\n' + text : text;
    });
    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }, 0);
  }, []);

  const { isRecording, isTranscribing, toggle } = useAudioRecorder({
    onResult: appendText,
    onError:  setMicError,
  });

  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);

  const handleParse = async () => {
    if (!lines.length) return;
    setPS('parsing');
    setApiError('');
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dump: input.trim() }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }
      const tasks: ParsedTask[] = await res.json();
      addParsedTasks(tasks);
      setInput('');
      router.push('/inbox');
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Помилка з\'єднання');
      setPS('error');
    } finally {
      setPS(s => s === 'parsing' ? 'idle' : s);
    }
  };

  const busy = isRecording || isTranscribing || parseStatus === 'parsing';

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)]">

      <header className="px-5 pt-12 pb-3 flex-none">
        <h1 className="text-2xl font-bold text-gray-900">Що в голові?</h1>
        <p className="text-sm text-gray-400 mt-1">
          {isRecording    ? '🔴 Записую… натисни ще раз щоб зупинити'
           : isTranscribing ? '⏳ Розпізнаю мову…'
           : 'Пиши або диктуй — AI розбере на задачі'}
        </p>
      </header>

      <div className="flex-1 px-4 py-2 min-h-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); setMicError(''); setApiError(''); }}
          disabled={busy}
          placeholder="Зустріч з Марком о 15:00&#10;Купити: молоко, яйця, хліб&#10;Дописати звіт до п'ятниці..."
          className="w-full h-full min-h-64 text-base text-gray-800 placeholder-gray-300 bg-gray-50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-colors leading-relaxed disabled:opacity-60"
        />
      </div>

      {/* Banners */}
      {isRecording && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl flex-none">
          <span className="relative flex h-3 w-3 flex-none">
            <span className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <p className="text-sm text-red-600 font-medium flex-1">Записую… говори зараз</p>
          <button onClick={toggle} className="text-xs text-red-400 underline">зупинити</button>
        </div>
      )}

      {isTranscribing && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl flex-none">
          <span className="relative flex h-3 w-3 flex-none">
            <span className="animate-ping absolute inset-0 rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
          </span>
          <p className="text-sm text-amber-700 font-medium">Whisper розпізнає мову…</p>
        </div>
      )}

      {parseStatus === 'parsing' && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex-none">
          <span className="relative flex h-3 w-3 flex-none">
            <span className="animate-ping absolute inset-0 rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
          </span>
          <p className="text-sm text-indigo-600 font-medium">AI розбирає задачі…</p>
        </div>
      )}

      {micError && (
        <div className="mx-4 mt-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl flex-none">
          <p className="text-sm text-red-500">{micError}</p>
        </div>
      )}
      {parseStatus === 'error' && apiError && (
        <div className="mx-4 mt-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl flex-none">
          <p className="text-sm text-red-500">{apiError}</p>
        </div>
      )}

      {/* FIX 4: visible counter — was text-xs gray-400, now readable */}
      {lines.length > 0 && !busy && (
        <div className="mx-4 mt-2 flex-none">
          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {lines.length} {lines.length === 1 ? 'думка' : lines.length < 5 ? 'думки' : 'думок'} готові до обробки
          </span>
        </div>
      )}

      <div className="px-4 pt-3 pb-4 flex items-center gap-3 flex-none">
        <button
          onClick={toggle}
          disabled={isTranscribing || parseStatus === 'parsing'}
          className={`relative flex-none w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 ${
            isRecording
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40'
          }`}
        >
          {isRecording && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />}
          <svg viewBox="0 0 24 24" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6 relative">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>

        <button
          onClick={handleParse}
          disabled={lines.length === 0 || busy}
          className="flex-1 h-14 bg-indigo-600 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-2xl font-semibold text-base transition-all active:scale-95 active:bg-indigo-700 disabled:cursor-not-allowed"
        >
          {parseStatus === 'parsing' ? 'Аналізую…'
           : lines.length === 0     ? 'Введи думки вище'
           : `Розібрати з AI (${lines.length})`}
        </button>
      </div>
    </div>
  );
}
