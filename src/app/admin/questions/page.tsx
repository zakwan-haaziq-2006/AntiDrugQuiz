'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { QuestionAdmin } from '@/types';

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionAdmin[]>([]);
  const [selectedSet, setSelectedSet] = useState<number>(1);
  const [activeQuizSet, setActiveQuizSet] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingQuestion, setEditingQuestion] = useState<QuestionAdmin | null>(null);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (setId: number) => {
    try {
      const res = await fetch(`/api/admin/questions?setId=${setId}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setQuestions(data.questions || []);
      if (data.activeSet) {
        setActiveQuizSet(data.activeSet);
      }
    } catch (err: any) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchQuestions(selectedSet);
  }, [fetchQuestions, selectedSet]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setError(null);
    const method = isNew ? 'POST' : 'PUT';
    const payload = {
      ...editingQuestion,
      setId: editingQuestion.setId || selectedSet,
    };

    try {
      const res = await fetch('/api/admin/questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save question.');
      }

      setEditingQuestion(null);
      await fetchQuestions(selectedSet);
    } catch (err: any) {
      setError(err.message || 'Error saving question.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchQuestions(selectedSet);
      }
    } catch (e) {
      console.error('Delete question error:', e);
    }
  };

  const openNewForm = () => {
    setIsNew(true);
    setEditingQuestion({
      id: '',
      setId: selectedSet,
      order: questions.length + 1,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <Header />
        <main className="flex-1 flex items-center justify-center font-mono text-sm text-neutral-500 font-medium">
          Loading questions...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <Link href="/admin" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-1 inline-block">
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Question Sets Management</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Viewing Set {selectedSet} ({questions.length} / 25 Questions) — Live Quiz Active Set: <strong className="text-blue-600">Set {activeQuizSet}</strong>
            </p>
          </div>

          <button
            onClick={openNewForm}
            className="rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-xs"
          >
            + Add Question to Set {selectedSet}
          </button>
        </div>

        {/* Set Selection Tabs */}
        <div className="mb-6 flex items-center gap-2 border-b border-neutral-200 pb-3">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mr-2 font-mono">Select Set:</span>
          {[1, 2, 3].map((setNum) => {
            const isCurrent = selectedSet === setNum;
            const isLive = activeQuizSet === setNum;
            return (
              <button
                key={setNum}
                onClick={() => setSelectedSet(setNum)}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                Set {setNum}
                {isLive && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isCurrent ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    LIVE ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">
                {isNew ? 'Add Question' : `Edit Question #${editingQuestion.order}`}
              </h2>

              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Question Text</label>
                  <textarea
                    required
                    rows={3}
                    value={editingQuestion.questionText}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Option A</label>
                    <input
                      type="text"
                      required
                      value={editingQuestion.optionA}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, optionA: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white p-2 text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Option B</label>
                    <input
                      type="text"
                      required
                      value={editingQuestion.optionB}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, optionB: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white p-2 text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Option C</label>
                    <input
                      type="text"
                      required
                      value={editingQuestion.optionC}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, optionC: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white p-2 text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Option D</label>
                    <input
                      type="text"
                      required
                      value={editingQuestion.optionD}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, optionD: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white p-2 text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Correct Answer Key</label>
                    <select
                      value={editingQuestion.correctAnswer}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value as any })}
                      className="w-full rounded-md border border-neutral-300 bg-white p-2 text-neutral-900 font-bold focus:border-neutral-900 focus:outline-hidden"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={editingQuestion.order}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, order: parseInt(e.target.value, 10) || 1 })}
                      className="w-full rounded-md border border-neutral-300 bg-white p-2 text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-md bg-neutral-900 text-white font-semibold hover:bg-neutral-800"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900 font-mono text-xs font-bold text-white">
                    {q.order}
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900">{q.questionText}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsNew(false);
                      setEditingQuestion(q);
                    }}
                    className="text-xs text-neutral-700 hover:bg-neutral-100 border border-neutral-300 px-2.5 py-1 rounded-md font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-2.5 py-1 rounded-md font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                <div className={`p-2.5 rounded-md border ${q.correctAnswer === 'A' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : 'border-neutral-200 bg-neutral-50 text-neutral-700'}`}>
                  A: {q.optionA}
                </div>
                <div className={`p-2.5 rounded-md border ${q.correctAnswer === 'B' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : 'border-neutral-200 bg-neutral-50 text-neutral-700'}`}>
                  B: {q.optionB}
                </div>
                <div className={`p-2.5 rounded-md border ${q.correctAnswer === 'C' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : 'border-neutral-200 bg-neutral-50 text-neutral-700'}`}>
                  C: {q.optionC}
                </div>
                <div className={`p-2.5 rounded-md border ${q.correctAnswer === 'D' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : 'border-neutral-200 bg-neutral-50 text-neutral-700'}`}>
                  D: {q.optionD}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
