'use client';

import React, { useEffect, useState } from 'react';

interface QuizTimerProps {
  startTimeIso: string | null;
  durationSec?: number;
  onExpire?: () => void;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  startTimeIso,
  durationSec = 1800,
  onExpire,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const hasExpiredRef = React.useRef<boolean>(false);

  useEffect(() => {
    if (!startTimeIso) return;

    const startTime = new Date(startTimeIso).getTime();
    const endTime = startTime + durationSec * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remainingMs = endTime - now;
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));

      setSecondsRemaining(remainingSec);

      if (remainingSec === 0) {
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          if (onExpire) onExpire();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTimeIso, durationSec, onExpire]);

  if (secondsRemaining === null) {
    return <span className="font-mono text-neutral-400">00:00</span>;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining < 300;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
        Time Remaining
      </span>
      <span
        className={`font-mono font-bold text-lg ${
          isUrgent
            ? 'text-red-600 animate-pulse'
            : 'text-neutral-900'
        }`}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
