'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';

const DEPARTMENTS = ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MCA', 'MBA'];
const YEARS = ['I', 'II', 'III', 'IV'];
const SECTIONS = ['A', 'B'];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    department: 'CSE',
    year: 'I',
    section: 'A',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/participant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      if (data.quizStatus === 'LIVE') {
        router.push('/quiz');
      } else {
        router.push('/waiting');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-lg mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center w-full">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-8 shadow-xs">
          <div className="mb-6 border-b border-neutral-100 pb-4">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider font-mono font-semibold text-neutral-500">
              Anti-Drug Club Quiz Competition
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mt-1">
              Participant Registration
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Please enter your official academic details to enter the quiz environment.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Roll No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your Roll No."
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 uppercase font-mono focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 font-medium focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 font-medium focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
                >
                  {YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 font-medium focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 rounded-md bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Enter Quiz Waiting Room →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
