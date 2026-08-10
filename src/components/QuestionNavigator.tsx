'use client';

import React from 'react';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, string>;
  questions: { id: string }[];
  onSelectQuestion: (index: number) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  questions,
  onSelectQuestion,
}) => {
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
        <h3 className="text-sm font-bold text-neutral-900">
          Question Matrix
        </h3>
        <span className="text-xs text-neutral-600 font-mono font-semibold">
          {answeredCount}/{totalQuestions} Answered
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 my-4">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qId = questions[idx]?.id;
          const isAnswered = Boolean(qId && answers[qId]);
          const isCurrent = idx === currentIndex;
          const isPrevious = idx < currentIndex;

          return (
            <button
              key={idx}
              onClick={() => onSelectQuestion(idx)}
              disabled={isPrevious}
              className={`flex h-9 items-center justify-center rounded-md text-xs font-mono font-semibold transition-all ${
                isCurrent
                  ? 'ring-2 ring-neutral-900 bg-neutral-900 text-white font-bold'
                  : isPrevious
                  ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-50'
                  : isAnswered
                  ? 'bg-neutral-100 text-neutral-900 border border-neutral-300 font-bold'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
              }`}
              title={`Question ${idx + 1} - ${isPrevious ? 'Completed (cannot re-visit)' : isAnswered ? 'Answered' : 'Unanswered'}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-around border-t border-neutral-100 pt-3 text-[11px] text-neutral-500 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-900" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-100 border border-neutral-400" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white border border-neutral-300" />
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
};
