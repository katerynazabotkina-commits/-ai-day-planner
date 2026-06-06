import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { TaskProvider } from '@/lib/TaskContext';
import BottomNav from '@/components/BottomNav';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Планер',
  description: 'Диктуй думки — AI сортує задачі',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${geist.className} h-full`}>
      <body className="h-full bg-gray-100 antialiased">
        <TaskProvider>
          <div className="relative mx-auto h-full max-w-md flex flex-col bg-white shadow-xl">
            <main className="flex-1 overflow-y-auto pb-[72px]">
              {children}
            </main>
            <BottomNav />
          </div>
        </TaskProvider>
      </body>
    </html>
  );
}
