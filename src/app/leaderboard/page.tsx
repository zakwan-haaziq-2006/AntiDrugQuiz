import React from 'react';
import { Header } from '@/components/Header';
import { Leaderboard } from '@/components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <Leaderboard />
      </main>
    </div>
  );
}
