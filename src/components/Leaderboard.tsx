'use client';

import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@/types';
import { io } from 'socket.io-client';

export const Leaderboard: React.FC = () => {
  const [published, setPublished] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Loading leaderboard...');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();

      if (data.published) {
        setPublished(true);
        setLeaderboard(data.leaderboard || []);
      } else {
        setPublished(false);
        setMessage(data.message || 'The leaderboard will be available once the first participant completes the quiz.');
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || undefined);

    socket.on('LEADERBOARD_UPDATED', (updatedData: LeaderboardEntry[]) => {
      setPublished(true);
      setLeaderboard(updatedData);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredLeaderboard = leaderboard.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || item.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500 font-medium">
        Loading live rankings...
      </div>
    );
  }

  if (!published) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-2xs">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">
          🏆 Live Leaderboard
        </h3>
        <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              🏆 Live Leaderboard
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Real-time Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">Top Participants • Sorted by Score & High Precision Duration</p>
        </div>

        <button
          onClick={fetchLeaderboard}
          className="text-xs font-semibold border border-neutral-300 hover:bg-neutral-50 px-3 py-1.5 rounded-md text-neutral-700 transition-colors self-start sm:self-auto"
        >
          Refresh Rankings
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Search by Name or Roll No..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
        />

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-medium"
        >
          <option value="ALL">All Departments</option>
          {['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MCA', 'MBA'].map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500 font-semibold bg-neutral-50">
              <th className="py-3 px-4 w-16">Rank</th>
              <th className="py-3 px-4">Participant Name</th>
              <th className="py-3 px-4">Roll No.</th>
              <th className="py-3 px-4">Dept / Year / Sec</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 px-4 text-right">Completion Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-mono">
            {filteredLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-500 font-sans text-xs">
                  No matching participants found on the leaderboard.
                </td>
              </tr>
            ) : (
              filteredLeaderboard.map((item) => {
                const isFirst = item.rank === 1;
              const isSecond = item.rank === 2;
              const isThird = item.rank === 3;

              return (
                <tr
                  key={item.participantId}
                  className={`transition-colors ${
                    isFirst
                      ? 'bg-amber-50/80 font-semibold'
                      : isSecond
                      ? 'bg-slate-50'
                      : isThird
                      ? 'bg-orange-50/70'
                      : 'hover:bg-neutral-50/60'
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold">
                    {isFirst ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                        🥇 1st
                      </span>
                    ) : isSecond ? (
                      <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                        🥈 2nd
                      </span>
                    ) : isThird ? (
                      <span className="inline-flex items-center gap-1 text-amber-800 font-bold">
                        🥉 3rd
                      </span>
                    ) : (
                      <span className="text-neutral-500">#{item.rank}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-sans font-bold text-neutral-900">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-neutral-700">
                    {item.rollNumber}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-900">{item.department}</span> • Year {item.year} ({item.section})
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-neutral-900">
                    {item.score} <span className="text-xs font-normal text-neutral-400">/ 25</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-800">
                    {item.formattedTime}
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
