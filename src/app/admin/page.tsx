'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { AdminStats } from '@/components/AdminStats';
import { io } from 'socket.io-client';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    quizStatus: 'UPCOMING',
    totalRegistered: 0,
    totalWaiting: 0,
    totalStarted: 0,
    totalCompleted: 0,
    totalMalpractice: 0,
  });
  const [waitingParticipants, setWaitingParticipants] = useState<any[]>([]);
  const [malpracticeLog, setMalpracticeLog] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/results');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load admin telemetry data.');
      }

      setError(null);
      setStats({
        quizStatus: data.quizStatus || 'UPCOMING',
        totalRegistered: data.totalRegistered || 0,
        totalWaiting: data.totalWaiting || 0,
        totalStarted: data.totalStarted || 0,
        totalCompleted: data.totalCompleted || 0,
        totalMalpractice: data.totalMalpractice || 0,
      });

      setWaitingParticipants(data.waitingParticipants || []);
      const malpracticeItems = (data.results || []).filter((r: any) => r.malpractice);
      setMalpracticeLog(malpracticeItems);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError(err.message || 'Failed to connect to admin API.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || undefined);

    socket.on('PARTICIPANT_REGISTERED', (data) => {
      setStats((prev) => ({
        ...prev,
        totalRegistered: prev.totalRegistered + 1,
        totalWaiting: prev.totalWaiting + 1,
      }));
      setWaitingParticipants((prev) => [data, ...prev]);
    });

    socket.on('MALPRACTICE_DETECTED', (data) => {
      setStats((prev) => ({ ...prev, totalMalpractice: prev.totalMalpractice + 1 }));
      setMalpracticeLog((prev) => [data, ...prev]);
    });

    socket.on('PARTICIPANT_COMPLETED', () => {
      fetchDashboardData();
    });

    const interval = setInterval(fetchDashboardData, 4000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const handleQuizControl = async (action: 'START' | 'END' | 'RESET') => {
    if (action === 'RESET') {
      const confirmed = window.confirm(
        '⚠ WARNING: Resetting the quiz will delete all participant attempts, recorded answers, and leaderboard scores! Are you sure you want to proceed?'
      );
      if (!confirmed) return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/quiz/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed.');
      }

      await fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to execute control action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <Header />
        <main className="flex-1 flex items-center justify-center font-mono text-sm text-neutral-500 font-medium">
          Loading admin monitoring portal...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header quizStatus={stats.quizStatus as any} />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Admin Live Monitoring Dashboard</h1>
            <p className="text-xs text-neutral-500 mt-1">Real-time competition controls and participant telemetry.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/questions"
              className="rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors shadow-2xs"
            >
              Question Management (25)
            </Link>
            <Link
              href="/admin/results"
              className="rounded-md bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-xs"
            >
              Full Results & CSV Export →
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
            >
              Sign Out 🔒
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <AdminStats
          quizStatus={stats.quizStatus}
          totalRegistered={stats.totalRegistered}
          totalWaiting={stats.totalWaiting}
          totalStarted={stats.totalStarted}
          totalCompleted={stats.totalCompleted}
          totalMalpractice={stats.totalMalpractice}
        />

        <div className="mb-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <h2 className="text-xs uppercase font-mono tracking-wider font-semibold text-neutral-500 mb-4">
            Event Control Station
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            {stats.quizStatus === 'UPCOMING' && (
              <button
                onClick={() => handleQuizControl('START')}
                disabled={actionLoading}
                className="px-8 py-3 rounded-md bg-emerald-600 font-bold text-sm text-white hover:bg-emerald-500 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                ▶ START QUIZ NOW
              </button>
            )}

            {stats.quizStatus === 'LIVE' && (
              <button
                onClick={() => handleQuizControl('END')}
                disabled={actionLoading}
                className="px-8 py-3 rounded-md bg-amber-600 font-bold text-sm text-white hover:bg-amber-500 shadow-md transition-all disabled:opacity-50"
              >
                ⏹ END QUIZ NOW
              </button>
            )}

            <button
              onClick={() => handleQuizControl('RESET')}
              disabled={actionLoading}
              className="px-5 py-3 rounded-md border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              🔄 Reset Quiz & Attempts
            </button>
          </div>

          <p className="text-xs text-neutral-600 mt-4 leading-relaxed">
            Clicking <strong className="text-neutral-900">START QUIZ</strong> immediately records the exact server start timestamp, updates status to LIVE, and signals all waiting participants to enter the 25-question quiz interface.
          </p>
        </div>

        {/* Waiting Room Lobby Telemetry */}
        <div className="mb-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              ⏳ Waiting Room Lobby ({waitingParticipants.length} Connected)
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Live Waiting State
            </span>
          </div>

          {waitingParticipants.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 font-mono">
              No participants currently in the waiting lobby.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 uppercase tracking-wider bg-neutral-50 font-semibold">
                    <th className="py-2.5 px-3">Participant Name</th>
                    <th className="py-2.5 px-3">Roll No.</th>
                    <th className="py-2.5 px-3">Dept / Year / Sec</th>
                    <th className="py-2.5 px-3">Registered At</th>
                    <th className="py-2.5 px-3 text-center">Lobby Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {waitingParticipants.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3 px-3 font-sans font-bold text-neutral-900">
                        {item.name}
                      </td>
                      <td className="py-3 px-3 text-neutral-700 font-semibold">
                        {item.rollNumber}
                      </td>
                      <td className="py-3 px-3 font-sans text-neutral-600">
                        {item.department} ({item.year}-{item.section})
                      </td>
                      <td className="py-3 px-3 text-neutral-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : 'Just now'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
                          WAITING IN LOBBY
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              ⚠ Malpractice & Window Blur Incidents
            </h3>
            <span className="text-xs font-mono font-semibold text-neutral-500">{malpracticeLog.length} Incidents Flagged</span>
          </div>

          {malpracticeLog.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 font-mono">
              No malpractice or tab switching incidents detected yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 uppercase tracking-wider bg-neutral-50 font-semibold">
                    <th className="py-2.5 px-3">Participant</th>
                    <th className="py-2.5 px-3">Roll No.</th>
                    <th className="py-2.5 px-3">Dept / Yr / Sec</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Tab Switches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {malpracticeLog.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3 px-3 font-sans font-bold text-neutral-900">
                        {item.name || item.participantName}
                      </td>
                      <td className="py-3 px-3 text-neutral-700 font-semibold">
                        {item.rollNumber}
                      </td>
                      <td className="py-3 px-3 font-sans text-neutral-600">
                        {item.department} ({item.year}-{item.section})
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                          {item.status === 'DISQUALIFIED' ? 'DISQUALIFIED' : 'MALPRACTICE FLAG'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-red-600">
                        {item.tabSwitchCount || item.totalSwitches || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
