'use client';

import React, { useEffect, useState } from 'react';

interface MalpracticeAlertProps {
  onMalpracticeDetected?: (eventType: string, incidentCount: number) => void;
  onDisqualified?: () => void;
}

export const MalpracticeAlert: React.FC<MalpracticeAlertProps> = ({
  onMalpracticeDetected,
  onDisqualified,
}) => {
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [incidentCount, setIncidentCount] = useState<number>(0);
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const [lastReason, setLastReason] = useState<string>('TAB_SWITCH');
  const lastTriggeredRef = React.useRef<number>(0);

  const triggerMalpractice = async (eventType: string) => {
    const now = Date.now();
    // Debounce triggers within 1500ms to prevent tab_switch + blur double triggering
    if (now - lastTriggeredRef.current < 1500) {
      return;
    }
    lastTriggeredRef.current = now;

    try {
      setLastReason(eventType);
      const res = await fetch('/api/quiz/malpractice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, metadata: { time: new Date().toISOString() } }),
      });

      const data = await res.json();
      const count = data.incidentCount || incidentCount + 1;
      setIncidentCount(count);
      setShowAlert(true);

      if (data.disqualified || count > 2) {
        setIsDisqualified(true);
        if (onDisqualified) onDisqualified();
      }

      if (onMalpracticeDetected) {
        onMalpracticeDetected(eventType, count);
      }
    } catch (e) {
      console.error('Failed to log malpractice event:', e);
    }
  };

  useEffect(() => {
    // 1. Tab Switch / Hidden Window Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerMalpractice('TAB_SWITCH');
      }
    };

    // 2. Window Blur (clicking outside or switching apps)
    const handleWindowBlur = () => {
      triggerMalpractice('WINDOW_BLUR');
    };

    // 3. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isFull) {
        triggerMalpractice('FULLSCREEN_EXIT');
      }
    };

    // 4. Split-Screen / Window Resize Detection
    const handleResize = () => {
      if (
        window.screen &&
        (window.innerWidth < window.screen.width * 0.75 || window.innerHeight < window.screen.height * 0.75)
      ) {
        triggerMalpractice('SPLIT_SCREEN');
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleAcknowledgeAndFullscreen = () => {
    const docEl = document.documentElement as any;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen().catch(() => {});
    }
    setShowAlert(false);
  };

  if (!showAlert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-red-800 bg-neutral-900 p-6 shadow-2xl text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-950/80 text-red-500 font-bold text-2xl border border-red-800/60 animate-bounce">
          {isDisqualified ? '❌' : '⚠'}
        </div>

        <h3 className="text-xl font-bold text-red-500 mb-2">
          {isDisqualified ? 'DISQUALIFIED FROM COMPETITION' : 'MALPRACTICE WARNING'}
        </h3>

        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4">
          {isDisqualified ? (
            <span className="text-red-300 font-medium">
              You exceeded the maximum limit of 2 malpractice warnings. Your quiz attempt has been terminated and disqualified.
            </span>
          ) : (
            <span>
              {lastReason === 'SPLIT_SCREEN'
                ? 'Split-screen / multi-window mode is strictly prohibited during the quiz competition.'
                : lastReason === 'FULLSCREEN_EXIT'
                ? 'Exiting full screen mode is recorded as a malpractice violation.'
                : 'You navigated away from the quiz window. This activity has been recorded.'}
            </span>
          )}
        </p>

        <div className="mb-5 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400 font-mono flex items-center justify-between">
          <span>Violation Type:</span>
          <span className="font-bold text-amber-400">{lastReason}</span>
        </div>

        <div className="mb-5 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400 font-mono flex items-center justify-between">
          <span>Malpractice Counter:</span>
          <span className={`font-bold ${isDisqualified ? 'text-red-500' : 'text-amber-400'}`}>
            {isDisqualified ? 'DISQUALIFIED (>2)' : `Warning ${incidentCount} of 2`}
          </span>
        </div>

        {isDisqualified ? (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-900/60 text-xs text-red-300 font-medium leading-relaxed">
            You cannot continue this attempt or re-register for this event.
          </div>
        ) : (
          <button
            onClick={handleAcknowledgeAndFullscreen}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-xs"
          >
            Re-Enter Full Screen & Resume →
          </button>
        )}
      </div>
    </div>
  );
};
