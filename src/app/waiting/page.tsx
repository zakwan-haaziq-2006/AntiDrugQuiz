'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { io } from 'socket.io-client';

export default function WaitingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('UPCOMING');

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/quiz/status');
      const data = await res.json();
      setStatus(data.status);
      if (data.status === 'LIVE') {
        router.push('/quiz');
      } else if (data.status === 'ENDED') {
        router.push('/leaderboard');
      }
    } catch (e) {
      console.error('Failed to check status:', e);
    }
  };

  useEffect(() => {
    checkStatus();

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || undefined);

    socket.on('QUIZ_STARTED', () => {
      router.push('/quiz');
    });

    socket.on('QUIZ_ENDED', () => {
      setStatus('ENDED');
      router.push('/leaderboard');
    });

    const pollInterval = setInterval(checkStatus, 3000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header quizStatus={status as any} />

      <main className="flex-1 max-w-lg mx-auto px-4 py-16 flex flex-col justify-center items-center text-center w-full">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-xs w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-mono text-xl animate-pulse border border-amber-300">
            ⏳
          </div>

          <h2 className="text-xs uppercase font-mono tracking-wider font-semibold text-neutral-500 mb-1">
            Anti-Drug Club Quiz
          </h2>

          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-4">
            You are registered successfully.
          </h1>

          <div className="my-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-800 space-y-2">
            <p className="font-bold text-amber-800">
              {status === 'ENDED' ? 'The quiz event has ended.' : 'The quiz has not started yet.'}
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {status === 'ENDED'
                ? 'The administrator has concluded the competition. You can view the live leaderboard results.'
                : 'Please wait for the administrator to start the quiz. Your screen will automatically transition when the event begins.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 font-mono font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Connected to Event Control • Server Synchronized</span>
          </div>
        </div>
      </main>
    </div>
  );
}
