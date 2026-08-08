'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';

export default function AdminResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [quizStatus, setQuizStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/results');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setResults(data.results || []);
      setQuizTitle(data.quizTitle || 'Anti-Drug Club Quiz Competition');
      setQuizStatus(data.quizStatus || '');
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || r.department === selectedDept;
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleExportCSV = () => {
    window.open('/api/admin/results?format=csv', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <Header />
        <main className="flex-1 flex items-center justify-center font-mono text-sm text-neutral-500 font-medium">
          Loading final results...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <Link href="/admin" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-1 inline-block">
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Competition Final Results</h1>
            <p className="text-xs text-neutral-500 mt-0.5">{quizTitle} • Total Participants: {results.length}</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition-colors flex items-center gap-2"
          >
            📥 Export Results as CSV
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by Name or Roll No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
          />

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-medium"
          >
            <option value="ALL">All Departments</option>
            {['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MCA', 'MBA'].map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="AUTO_SUBMITTED">AUTO_SUBMITTED</option>
            <option value="DISQUALIFIED">DISQUALIFIED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
          </select>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">Roll No.</th>
                  <th className="py-3 px-4">Dept / Year / Sec</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-right">Duration</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Malpractice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500 font-sans">
                      No matching participants found.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => {
                  const isTop1 = r.rank === 1;
                  const isTop2 = r.rank === 2;
                  const isTop3 = r.rank === 3;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-neutral-50 ${
                        isTop1
                          ? 'bg-amber-50/80 font-bold'
                          : isTop2
                          ? 'bg-slate-50 font-semibold'
                          : isTop3
                          ? 'bg-orange-50/70 font-semibold'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-sm">
                        {isTop1 ? (
                          <span className="text-amber-700">🥇 1</span>
                        ) : isTop2 ? (
                          <span className="text-slate-700">🥈 2</span>
                        ) : isTop3 ? (
                          <span className="text-amber-800">🥉 3</span>
                        ) : (
                          <span className="text-neutral-500">{r.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-bold text-neutral-900">
                        {r.name}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-700 font-semibold">
                        {r.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-neutral-600">
                        {r.department} • Year {r.year} ({r.section})
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-neutral-900 text-sm">
                        {r.score} <span className="text-xs font-normal text-neutral-400">/ 25</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-800">
                        {r.formattedTime}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            r.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : r.status === 'AUTO_SUBMITTED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : r.status === 'DISQUALIFIED'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.malpractice ? (
                          <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-300">
                            FLAGGED ({r.tabSwitchCount})
                          </span>
                        ) : (
                          <span className="text-neutral-400">Clean</span>
                        )}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
