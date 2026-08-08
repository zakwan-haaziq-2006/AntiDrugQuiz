'use client';

import React from 'react';

interface AdminStatsProps {
  quizStatus: string;
  totalRegistered: number;
  totalWaiting?: number;
  totalStarted: number;
  totalCompleted: number;
  totalMalpractice: number;
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  quizStatus,
  totalRegistered,
  totalWaiting = 0,
  totalStarted,
  totalCompleted,
  totalMalpractice,
}) => {
  const stats = [
    {
      label: 'Quiz Status',
      value: quizStatus,
      badgeColor:
        quizStatus === 'LIVE'
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          : quizStatus === 'UPCOMING'
          ? 'bg-amber-100 text-amber-800 border border-amber-300'
          : 'bg-neutral-100 text-neutral-800 border border-neutral-300',
    },
    { label: 'Total Registered', value: totalRegistered },
    {
      label: '⏳ Waiting in Lobby',
      value: totalWaiting,
      textColor: totalWaiting > 0 ? 'text-amber-700 font-bold' : '',
    },
    { label: 'Submissions Done', value: totalCompleted },
    {
      label: 'Malpractice Incidents',
      value: totalMalpractice,
      textColor: totalMalpractice > 0 ? 'text-red-600 font-bold' : '',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-8">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs"
        >
          <div className="text-xs font-semibold text-neutral-500 mb-1">{stat.label}</div>
          {stat.badgeColor ? (
            <span className={`inline-block rounded px-2.5 py-1 text-sm font-bold ${stat.badgeColor}`}>
              {stat.value}
            </span>
          ) : (
            <div className={`text-2xl font-bold text-neutral-900 ${stat.textColor || ''}`}>
              {stat.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
