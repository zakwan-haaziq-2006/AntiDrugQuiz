'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  quizStatus?: 'UPCOMING' | 'LIVE' | 'ENDED';
  participantName?: string;
}

export const Header: React.FC<HeaderProps> = ({ quizStatus, participantName }) => {
  return (
    <header className="border-b border-neutral-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="font-bold tracking-tight text-neutral-900 text-base sm:text-lg">
            Anti-Drug Club <span className="text-neutral-500 font-normal hidden sm:inline">Quiz Platform</span>
          </Link>
          {quizStatus && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-semibold ${
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

        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm text-neutral-600 font-medium">
          {participantName && (
            <span className="font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-neutral-200 truncate max-w-[120px] sm:max-w-xs">
              {participantName}
            </span>
          )}
          <Link
            href="/leaderboard"
            className="hover:text-neutral-900 transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/admin"
            className="hover:text-neutral-900 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
};
