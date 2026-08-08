'use client';

import React from 'react';
import { QuestionClient } from '@/types';

interface QuestionCardProps {
  question: QuestionClient;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer?: string;
  onSelectOption: (optionKey: 'A' | 'B' | 'C' | 'D') => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onSelectOption,
}) => {
  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ] as const;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between text-xs text-neutral-500 font-semibold border-b border-neutral-100 pb-3">
        <span>QUESTION {currentIndex + 1} OF {totalQuestions}</span>
        {selectedAnswer && <span className="text-emerald-700 font-bold">✓ Answered</span>}
      </div>

      <h2 className="text-lg font-bold text-neutral-900 mb-6 leading-snug">
        {question.questionText}
      </h2>

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onSelectOption(opt.key)}
              className={`w-full text-left p-4 rounded-lg border text-sm transition-all flex items-start gap-3 ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white font-medium shadow-2xs'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50/50'
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isSelected
                    ? 'bg-white text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {opt.key}
              </span>
              <span className="leading-tight">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
