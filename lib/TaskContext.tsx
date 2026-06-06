'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Task {
  id: string;
  text: string;
  done: boolean;
  inToday: boolean;
  createdAt: number;
}

interface Ctx {
  tasks: Task[];
  addTasks: (texts: string[]) => void;
  toggleDone: (id: string) => void;
  toggleToday: (id: string) => void;
  deleteTask: (id: string) => void;
}

const TaskContext = createContext<Ctx | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-planner-tasks');
      if (saved) setTasks(JSON.parse(saved));
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('ai-planner-tasks', JSON.stringify(tasks));
    }
  }, [tasks, hydrated]);

  const addTasks = (texts: string[]) => {
    const newTasks: Task[] = texts.map((text, i) => ({
      id: `${Date.now()}-${i}`,
      text: text.trim(),
      done: false,
      inToday: false,
      createdAt: Date.now(),
    }));
    setTasks(prev => [...newTasks, ...prev]);
  };

  const toggleDone = (id: string) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));

  const toggleToday = (id: string) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, inToday: !t.inToday } : t)));

  const deleteTask = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <TaskContext.Provider value={{ tasks, addTasks, toggleDone, toggleToday, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used inside TaskProvider');
  return ctx;
}
