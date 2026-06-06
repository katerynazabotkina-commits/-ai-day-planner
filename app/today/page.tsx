'use client';

import { useRouter } from 'next/navigation';
import { useTasks, Task } from '@/lib/TaskContext';

function TodayItem({ task }: { task: Task }) {
  const { toggleDone } = useTasks();

  return (
    // FIX 2+5: larger touch area (py-4 → py-5) and show metadata
    <button
      onClick={() => toggleDone(task.id)}
      className={`w-full flex items-center gap-4 px-4 py-5 rounded-2xl border transition-all active:scale-[0.98] text-left ${
        task.done
          ? 'bg-green-50 border-green-100'
          : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      {/* FIX 2: visual checkbox larger (w-7 → w-8 h-8) */}
      <div className={`flex-none w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
        task.done ? 'bg-green-500 border-green-500' : 'border-gray-300'
      }`}>
        {task.done && (
          <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 7l3.5 3.5 6-6" />
          </svg>
        )}
      </div>

      {/* FIX 5: show text + priority + estimate */}
      <div className="flex-1 min-w-0">
        <span className={`text-base leading-snug block ${
          task.done ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'
        }`}>
          {task.text}
        </span>
        {!task.done && (task.priority === 'must' || task.estimateMin > 0) && (
          <div className="flex items-center gap-2 mt-1">
            {task.priority === 'must' && (
              <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">must</span>
            )}
            {task.estimateMin > 0 && (
              <span className="text-[11px] text-gray-400">{task.estimateMin} хв</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export default function TodayPage() {
  const { tasks } = useTasks();
  const router = useRouter();
  const todayTasks = tasks.filter(t => t.inToday);
  const doneTasks = todayTasks.filter(t => t.done);
  const progress = todayTasks.length > 0 ? (doneTasks.length / todayTasks.length) * 100 : 0;

  const dateStr = new Date().toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)]">
      <header className="px-5 pt-12 pb-4 flex-none">
        <h1 className="text-2xl font-bold text-gray-900 capitalize">{dateStr}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {todayTasks.length === 0
            ? 'Додай задачі з Inbox'
            : `${doneTasks.length} з ${todayTasks.length} виконано`}
        </p>
        {todayTasks.length > 0 && (
          // FIX 5: thicker progress bar, easier to see
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <div className="flex-1 px-4 space-y-2 pb-4">
        {todayTasks.length === 0 ? (
          // FIX 3: proper empty state with full-width CTA button
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <span className="text-6xl">✅</span>
            <div>
              <p className="text-gray-700 font-semibold text-lg">День поки порожній</p>
              <p className="text-gray-400 text-sm mt-1">Додай задачі зі стрілкою ↓ в Inbox</p>
            </div>
            <button
              onClick={() => router.push('/inbox')}
              className="mt-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-2xl active:scale-95 transition-all"
            >
              Відкрити Inbox
            </button>
          </div>
        ) : (
          todayTasks.map(task => <TodayItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
