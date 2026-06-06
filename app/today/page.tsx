'use client';

import Link from 'next/link';
import { useTasks, Task } from '@/lib/TaskContext';

function TodayItem({ task }: { task: Task }) {
  const { toggleDone } = useTasks();

  return (
    <button
      onClick={() => toggleDone(task.id)}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all active:scale-[0.98] text-left ${
        task.done
          ? 'bg-green-50 border-green-100'
          : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div
        className={`flex-none w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
          task.done ? 'bg-green-500 border-green-500' : 'border-gray-300'
        }`}
      >
        {task.done && (
          <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 7l3.5 3.5 6-6" />
          </svg>
        )}
      </div>

      <span
        className={`flex-1 text-base leading-snug ${
          task.done ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'
        }`}
      >
        {task.text}
      </span>
    </button>
  );
}

export default function TodayPage() {
  const { tasks } = useTasks();
  const todayTasks = tasks.filter(t => t.inToday);
  const doneTasks = todayTasks.filter(t => t.done);
  const progress = todayTasks.length > 0 ? (doneTasks.length / todayTasks.length) * 100 : 0;

  const dateStr = new Date().toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)]">
      <header className="px-5 pt-12 pb-4 flex-none">
        <h1 className="text-2xl font-bold text-gray-900 capitalize">{dateStr}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {todayTasks.length === 0
            ? 'Додай задачі з Inbox'
            : `${doneTasks.length} з ${todayTasks.length} виконано`}
        </p>
        {todayTasks.length > 0 && (
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <div className="flex-1 px-4 space-y-2 pb-4">
        {todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-2">
            <span className="text-5xl">✅</span>
            <p className="text-gray-500 font-medium">План на день порожній</p>
            <p className="text-gray-400 text-sm">
              Відмітки задачі в{' '}
              <Link href="/inbox" className="text-indigo-500 underline underline-offset-2">
                Inbox
              </Link>{' '}
              стрілкою вниз
            </p>
          </div>
        ) : (
          todayTasks.map(task => <TodayItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
