'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTasks, Task } from '@/lib/TaskContext';

function TaskCard({ task }: { task: Task }) {
  const { toggleDone, toggleToday, deleteTask } = useTasks();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-3 bg-white rounded-2xl border transition-all ${
        task.done ? 'opacity-50 border-gray-100' : 'border-gray-100 shadow-sm'
      }`}
    >
      {/* FIX 2: 44×44px touch target around small visual checkbox */}
      <button
        onClick={() => toggleDone(task.id)}
        className="flex-none flex items-center justify-center w-11 h-11 -ml-1 rounded-xl active:bg-gray-50"
        aria-label="Позначити виконаним"
      >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.done ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
        }`}>
          {task.done && (
            <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
            </svg>
          )}
        </div>
      </button>

      {/* Text + meta */}
      <div className="flex-1 min-w-0 py-1">
        <p className={`text-base text-gray-800 leading-snug ${task.done ? 'line-through text-gray-400' : ''}`}>
          {task.text}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.priority === 'must' && (
            <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">must</span>
          )}
          {task.estimateMin > 0 && (
            <span className="text-[11px] text-gray-400">{task.estimateMin} хв</span>
          )}
          {task.deadline && (
            <span className="text-[11px] text-indigo-500 font-medium">{task.deadline}</span>
          )}
        </div>
      </div>

      {/* FIX 2: 44px touch targets for action buttons */}
      <button
        onClick={() => toggleToday(task.id)}
        className={`flex-none flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
          task.inToday ? 'bg-indigo-100 text-indigo-600' : 'text-gray-300 active:bg-gray-100'
        }`}
        aria-label={task.inToday ? 'Прибрати з Сьогодні' : 'Додати до Сьогодні'}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" />
        </svg>
      </button>

      <button
        onClick={() => deleteTask(task.id)}
        className="flex-none flex items-center justify-center w-11 h-11 -mr-1 rounded-xl text-gray-300 active:text-red-400 active:bg-red-50 transition-colors"
        aria-label="Видалити"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function InboxPage() {
  const { tasks } = useTasks();
  const router = useRouter();
  const inboxTasks = tasks.filter(t => !t.inToday);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)]">
      <header className="px-5 pt-12 pb-4 flex-none">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500 mt-1">
          {inboxTasks.length === 0 ? 'Все чисто!' : `${inboxTasks.length} задач`}
        </p>
      </header>

      <div className="flex-1 px-4 space-y-2 pb-4">
        {inboxTasks.length === 0 ? (
          // FIX 3: proper empty state with full-width CTA button
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <span className="text-6xl">📥</span>
            <div className="gap-1">
              <p className="text-gray-700 font-semibold text-lg">Inbox порожній</p>
              <p className="text-gray-400 text-sm mt-1">Надиктуй або напиши думки на Capture</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-2xl active:scale-95 transition-all"
            >
              Відкрити Capture
            </button>
          </div>
        ) : (
          inboxTasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
