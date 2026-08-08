'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  quizStatus?: 'UPCOMING' | 'LIVE' | 'ENDED';
  participantName?: string;
}

export const Header: React.FC<HeaderProps> = ({ quizStatus, participantName }) => {
  return (
    <header className="border-b border-neutral-200 bg-white px-4 py-3 shadow-2xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold tracking-tight text-neutral-900 text-lg">
            Anti-Drug Club <span className="text-neutral-500 font-normal">Quiz Platform</span>
          </Link>
          {quizStatus && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                quizStatus === 'LIVE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : quizStatus === 'UPCOMING'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
              }`}
            >
              ● {quizStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-5 text-sm text-neutral-600 font-medium">
          {participantName && (
            <span className="font-semibold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-200">
              {participantName}
            </span>
          )}
          <Link
            href="/leaderboard"
            className="hover:text-neutral-900 transition-colors"
          >
            Live Leaderboard
          </Link>
          <Link
            href="/admin"
            className="hover:text-neutral-900 transition-colors"
          >
            Admin Portal
          </Link>
        </div>
      </div>
    </header>
  );
};
