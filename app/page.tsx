'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/lib/TaskContext';

export default function CapturePage() {
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const { addTasks } = useTasks();
  const router = useRouter();

  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);

  const handleParse = () => {
    if (lines.length === 0) return;
    addTasks(lines);
    setInput('');
    router.push('/inbox');
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-72px)]">
      {/* Header */}
      <header className="px-5 pt-12 pb-3 flex-none">
        <h1 className="text-2xl font-bold text-gray-900">Що в голові?</h1>
        <p className="text-sm text-gray-400 mt-1">Пиши все підряд — розберемо разом</p>
      </header>

      {/* Textarea */}
      <div className="flex-1 px-4 py-2 min-h-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Зустріч з Марком о 15:00&#10;Купити: молоко, яйця, хліб&#10;Позвонити лікарю&#10;Дописати звіт до п'ятниці..."
          className="w-full h-full min-h-64 text-base text-gray-800 placeholder-gray-300 bg-gray-50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-colors leading-relaxed"
        />
      </div>

      {/* Hint */}
      {lines.length > 0 && (
        <p className="px-5 text-xs text-gray-400 flex-none">
          {lines.length} {lines.length === 1 ? 'думка' : lines.length < 5 ? 'думки' : 'думок'} готові до обробки
        </p>
      )}

      {/* Action buttons */}
      <div className="px-4 pt-3 pb-4 flex items-center gap-3 flex-none">
        <button
          onClick={() => setRecording(r => !r)}
          className={`flex-none w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
            recording
              ? 'bg-red-500 text-white shadow-red-200 scale-105'
              : 'bg-gray-100 text-gray-500 active:bg-gray-200'
          }`}
          aria-label={recording ? 'Зупинити запис' : 'Голосовий ввід (скоро)'}
        >
          <svg
            viewBox="0 0 24 24"
            fill={recording ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </button>

        <button
          onClick={handleParse}
          disabled={lines.length === 0}
          className="flex-1 h-14 bg-indigo-600 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-2xl font-semibold text-base transition-all active:scale-95 active:bg-indigo-700 disabled:cursor-not-allowed"
        >
          {lines.length === 0 ? 'Введи думки вище' : `Додати до Inbox (${lines.length})`}
        </button>
      </div>
    </div>
  );
}
