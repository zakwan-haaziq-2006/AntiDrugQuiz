import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-mono text-neutral-600 mb-6 shadow-2xs">
          <span>Anti-Drug Club Awareness Event 2026</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-6 max-w-2xl leading-tight">
          Anti-Drug Awareness Quiz Competition
        </h1>

        <p className="text-neutral-600 text-base md:text-lg mb-10 max-w-xl leading-relaxed">
          Test your knowledge on substance abuse prevention, health impacts, and healthy coping mechanisms. Compete live for the Top 3 positions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12 text-left">
          <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50/70 shadow-2xs">
            <div className="text-xs uppercase font-mono text-neutral-500 font-semibold mb-1">Questions</div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">25 MCQs</div>
            <p className="text-xs text-neutral-600">Multiple choice questions with 4 options per question.</p>
          </div>

          <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50/70 shadow-2xs">
            <div className="text-xs uppercase font-mono text-neutral-500 font-semibold mb-1">Duration</div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">30 Minutes</div>
            <p className="text-xs text-neutral-600">Server-synchronized countdown timer.</p>
          </div>

          <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50/70 shadow-2xs">
            <div className="text-xs uppercase font-mono text-neutral-500 font-semibold mb-1">Ranking</div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">Live Leaderboard</div>
            <p className="text-xs text-neutral-600">Precision duration tie-breaking in milliseconds.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors shadow-xs"
          >
            Register as Participant →
          </Link>
          <Link
            href="/leaderboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg border border-neutral-300 bg-white font-medium text-sm text-neutral-800 hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            View Live Leaderboard
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-100 w-full text-xs text-neutral-500 flex justify-between items-center">
          <span>College Anti-Drug Club Quiz Competition</span>
          <Link href="/admin/login" className="hover:text-neutral-900 transition-colors font-medium">
            Admin Access
          </Link>
        </div>
      </main>
    </div>
  );
}
