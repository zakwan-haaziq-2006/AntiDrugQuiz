'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { QuizTimer } from '@/components/QuizTimer';
import { QuestionCard } from '@/components/QuestionCard';
import { QuestionNavigator } from '@/components/QuestionNavigator';
import { MalpracticeAlert } from '@/components/MalpracticeAlert';
import { QuestionClient } from '@/types';
import { io } from 'socket.io-client';

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionClient[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [quizStartTime, setQuizStartTime] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number>(1800);
  const [quizStatus, setQuizStatus] = useState<string>('LIVE');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState<boolean>(true);
  const [agreedToGuidelines, setAgreedToGuidelines] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const acknowledged = sessionStorage.getItem('guidelines_acknowledged');
      if (acknowledged === 'true') {
        setShowGuidelinesModal(false);
      }
    }
  }, []);

  // Submit quiz
  const handleSubmitQuiz = useCallback(async (autoSubmitted = false) => {
    if (submitting || submittedResult) return;
    setSubmitting(true);
    setError(null);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSubmitted }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed.');
      }

      setSubmittedResult(data);
      if (data.status === 'DISQUALIFIED') {
        setIsDisqualified(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, submittedResult]);

  // Load quiz status and questions
  const loadQuizData = useCallback(async () => {
    try {
      const statusRes = await fetch('/api/quiz/status');
      const statusData = await statusRes.json();

      setQuizStatus(statusData.status);
      setQuizStartTime(statusData.startTime);
      setDurationSec(statusData.durationSec || 1800);

      if (statusData.status === 'UPCOMING') {
        router.push('/waiting');
        return;
      }

      if (statusData.status === 'ENDED' && !submittedResult) {
        handleSubmitQuiz(true);
        return;
      }

      const qRes = await fetch('/api/quiz/questions');
      if (qRes.status === 401) {
        router.push('/register');
        return;
      }

      const qData = await qRes.json();
      setQuestions(qData.questions || []);
      if (qData.savedAnswers) {
        setAnswers(qData.savedAnswers);
      }
    } catch (err: any) {
      console.error('Failed to load quiz data:', err);
      setError('Failed to load quiz. Please refresh or check connection.');
    } finally {
      setLoading(false);
    }
  }, [router, submittedResult, handleSubmitQuiz]);

  useEffect(() => {
    loadQuizData();

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || undefined);

    socket.on('QUIZ_ENDED', () => {
      setQuizStatus('ENDED');
      handleSubmitQuiz(true);
    });

    const statusInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/quiz/status');
        const data = await res.json();
        if (data.status === 'ENDED' && !submittedResult) {
          handleSubmitQuiz(true);
        }
      } catch (e) {
        // ignore
      }
    }, 4000);

    // 1-second real-time client time expiration lock
    const timerLockInterval = setInterval(() => {
      if (quizStartTime && durationSec && !submittedResult && !submitting) {
        const endTime = new Date(quizStartTime).getTime() + durationSec * 1000;
        if (Date.now() >= endTime) {
          setQuizStatus('ENDED');
          handleSubmitQuiz(true);
        }
      }
    }, 1000);

    return () => {
      socket.disconnect();
      clearInterval(statusInterval);
      clearInterval(timerLockInterval);
    };
  }, [loadQuizData, handleSubmitQuiz, submittedResult, quizStartTime, durationSec, submitting]);

  // Handle progressive answer selection
  const handleSelectOption = async (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (submittedResult || submitting || isDisqualified || quizStatus === 'ENDED') return;

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const updatedAnswers = { ...answers, [currentQuestion.id]: optionKey };
    setAnswers(updatedAnswers);
    setSaveStatus('saving');

    try {
      const res = await fetch('/api/quiz/save-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer: optionKey,
        }),
      });

      const data = await res.json();
      if (!res.ok && data.timeExpired) {
        setQuizStatus('ENDED');
        handleSubmitQuiz(true);
        return;
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (e) {
      console.error('Failed to save answer progressively:', e);
      setSaveStatus('idle');
    }
  };

  // Keyboard Navigation & Option Shortcuts
  useEffect(() => {
    if (loading || submittedResult || isDisqualified || showConfirmModal || showGuidelinesModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      if (['1', 'A'].includes(key)) {
        handleSelectOption('A');
      } else if (['2', 'B'].includes(key)) {
        handleSelectOption('B');
      } else if (['3', 'C'].includes(key)) {
        handleSelectOption('C');
      } else if (['4', 'D'].includes(key)) {
        handleSelectOption('D');
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, submittedResult, isDisqualified, showConfirmModal, showGuidelinesModal, currentIndex, questions.length, answers]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <Header />
        <main className="flex-1 flex items-center justify-center font-mono text-sm text-neutral-500 font-medium">
          Loading quiz questions...
        </main>
      </div>
    );
  }

  // Submission / Disqualification confirmation screen
  if (submittedResult || isDisqualified) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
        <Header />
        <main className="flex-1 max-w-lg mx-auto px-4 py-16 flex flex-col justify-center items-center w-full">
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center w-full shadow-sm">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full font-bold text-2xl border ${
              isDisqualified || submittedResult?.status === 'DISQUALIFIED'
                ? 'bg-red-100 text-red-600 border-red-200'
                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}>
              {isDisqualified || submittedResult?.status === 'DISQUALIFIED' ? '❌' : '✓'}
            </div>

            <h1 className={`text-xs font-mono uppercase tracking-wider font-bold mb-1 ${
              isDisqualified || submittedResult?.status === 'DISQUALIFIED' ? 'text-red-600' : 'text-emerald-700'
            }`}>
              {isDisqualified || submittedResult?.status === 'DISQUALIFIED'
                ? 'Attempt Terminated & Disqualified'
                : 'Quiz Submitted Successfully'}
            </h1>

            <h2 className="text-xl font-bold text-neutral-900 mb-6">
              Participant: {submittedResult?.participantName || 'Registered User'}
            </h2>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-left space-y-3 mb-6 font-mono text-sm">
              <div className="flex justify-between border-b border-neutral-200 pb-2">
                <span className="text-neutral-500">Score:</span>
                <span className="font-bold text-neutral-900">
                  {submittedResult?.score ?? 0} / {submittedResult?.totalQuestions || 25}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-2">
                <span className="text-neutral-500">Completion Time:</span>
                <span className="font-bold text-neutral-900">{submittedResult?.formattedTime || '--:--.---'}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500 pt-1">
                <span>Status:</span>
                <span className={`font-bold ${isDisqualified || submittedResult?.status === 'DISQUALIFIED' ? 'text-red-600' : 'text-emerald-700'}`}>
                  {submittedResult?.status || (isDisqualified ? 'DISQUALIFIED' : 'COMPLETED')}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
              {isDisqualified || submittedResult?.status === 'DISQUALIFIED'
                ? 'You exceeded the maximum limit of 2 malpractice warnings. Your attempt has been disqualified and you cannot re-register.'
                : 'Your response has been recorded with high precision server timestamp. The final ranking is available on the live leaderboard.'}
            </p>

            <button
              onClick={() => router.push('/leaderboard')}
              className="w-full rounded-md bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors shadow-xs"
            >
              View Live Leaderboard →
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Official Pre-Quiz Competition Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-2xl animate-fade-in my-auto">
            <div className="mb-4 border-b border-neutral-100 pb-3">
              <span className="text-xs uppercase tracking-wider font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block mb-1">
                Official Competition Protocol
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                Anti-Drug Awareness Quiz Guidelines
              </h2>
            </div>

            <p className="text-xs text-neutral-600 mb-5 leading-relaxed">
              Please carefully review the official competition rules, anti-cheating measures, and scoring rules before entering your test environment.
            </p>

            <div className="space-y-3.5 mb-6 text-xs text-neutral-800">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-1.5">
                <div className="font-bold text-neutral-900 text-xs flex items-center gap-2">
                  📌 1. Test Format & Timing
                </div>
                <ul className="list-disc list-inside text-neutral-600 space-y-1 pl-1">
                  <li><strong>25 Multiple Choice Questions</strong> (4 options per question).</li>
                  <li><strong>30 Minutes Total Duration</strong> with server-synchronized countdown.</li>
                  <li>When the countdown expires, your test will automatically finalize and submit.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1.5">
                <div className="font-bold text-red-700 text-xs flex items-center gap-2">
                  ⚠️ 2. Strict Anti-Malpractice & Tab-Switching Rules
                </div>
                <ul className="list-disc list-inside text-red-900/90 space-y-1 pl-1">
                  <li><strong>Switching tabs or hiding the window is strictly monitored</strong>.</li>
                  <li><strong>Warning 1 & 2</strong>: Navigating away logs a recorded malpractice incident.</li>
                  <li><strong>3rd Infraction = IMMEDIATE DISQUALIFICATION</strong>: Your attempt will be terminated instantly, your score set to 0, and you will be barred from re-registering.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-1.5">
                <div className="font-bold text-neutral-900 text-xs flex items-center gap-2">
                  🏆 3. Scoring & High-Precision Leaderboard Ranking
                </div>
                <ul className="list-disc list-inside text-neutral-600 space-y-1 pl-1">
                  <li><strong>Primary Rank</strong>: Total correct answers.</li>
                  <li><strong>Tie-Breaker</strong>: High-precision duration measured in <strong>milliseconds</strong> (faster submission wins).</li>
                </ul>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-1.5">
                <div className="font-bold text-neutral-900 text-xs flex items-center gap-2">
                  ⌨️ 4. Keyboard Shortcuts
                </div>
                <p className="text-neutral-600 pl-1">
                  Press <strong>1, 2, 3, 4</strong> (or <strong>A, B, C, D</strong>) to select options • Use <strong>← / →</strong> arrow keys to navigate questions.
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-neutral-300 bg-neutral-100 p-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="agree-rules"
                checked={agreedToGuidelines}
                onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-400 text-neutral-900 focus:ring-neutral-900"
              />
              <label htmlFor="agree-rules" className="text-xs font-semibold text-neutral-900 leading-snug cursor-pointer">
                I have read, understood, and agree to strictly comply with all competition rules, malpractice policies, and anti-cheating guidelines.
              </label>
            </div>

            <button
              onClick={() => {
                sessionStorage.setItem('guidelines_acknowledged', 'true');
                setShowGuidelinesModal(false);
              }}
              disabled={!agreedToGuidelines}
              className="w-full rounded-lg bg-neutral-900 py-3.5 text-sm font-bold text-white hover:bg-neutral-800 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Quiz Test Now →
            </button>
          </div>
        </div>
      )}

      <MalpracticeAlert
        onDisqualified={() => setIsDisqualified(true)}
      />

      <Header quizStatus={quizStatus as any} />

      {/* Progress Bar & Header Bar */}
      <div className="border-b border-neutral-200 bg-white shadow-2xs">
        <div className="w-full bg-neutral-100 h-1.5">
          <div
            className="bg-emerald-500 h-1.5 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-neutral-500">
              QUESTION {currentIndex + 1} OF {questions.length}
            </span>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              {progressPercent}% Complete
            </span>
            {saveStatus === 'saving' && (
              <span className="text-[11px] font-mono text-amber-600 animate-pulse">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[11px] font-mono text-emerald-600 font-bold">Saved ✓</span>
            )}
          </div>

          <QuizTimer
            startTimeIso={quizStartTime}
            durationSec={durationSec}
            onExpire={() => handleSubmitQuiz(true)}
          />
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Confirm Quiz Submission</h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              Are you sure you want to finalize and submit your quiz attempt?
            </p>

            <div className="mb-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Questions:</span>
                <span className="font-bold text-neutral-900">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Answered:</span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Unanswered:</span>
                <span className={`font-bold ${unansweredCount > 0 ? 'text-amber-600' : 'text-neutral-700'}`}>
                  {unansweredCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 rounded-md border border-neutral-300 bg-white py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Continue Quiz
              </button>
              <button
                onClick={() => handleSubmitQuiz(false)}
                disabled={submitting}
                className="w-1/2 rounded-md bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Now ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQuestion.id]}
              onSelectOption={handleSelectOption}
            />
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-md border border-neutral-300 bg-white text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              ← Previous (Left Arrow)
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-2.5 rounded-md bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors shadow-xs"
              >
                Next Question (Right Arrow) →
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
                className="px-6 py-2.5 rounded-md bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors shadow-xs disabled:opacity-50"
              >
                Submit Quiz ✓
              </button>
            )}
          </div>

          <p className="text-[11px] text-neutral-400 font-mono text-center">
            Pro Tip: Use keys 1, 2, 3, 4 (or A, B, C, D) to pick options • Use ← / → arrows to navigate.
          </p>
        </div>

        <div className="space-y-6">
          <QuestionNavigator
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answers={answers}
            questions={questions}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
          />

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
            <h4 className="text-xs uppercase font-mono text-neutral-500 font-semibold mb-2">Final Submission</h4>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Ensure you have answered all questions. You can submit before the timer expires.
            </p>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="w-full rounded-md border border-emerald-600 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Complete & Submit Quiz'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
