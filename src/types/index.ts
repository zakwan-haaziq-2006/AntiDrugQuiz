export type QuizStatus = 'UPCOMING' | 'LIVE' | 'ENDED';

export interface QuestionClient {
  id: string;
  setId?: number;
  order: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export interface QuestionAdmin extends QuestionClient {
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface ParticipantSession {
  participantId: string;
  attemptId: string;
  name: string;
  rollNumber: string;
  department: string;
  year: string;
  section: string;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  name: string;
  rollNumber: string;
  department: string;
  year: string;
  section: string;
  score: number;
  completionTimeMs: number;
  formattedTime: string;
  submittedAt: string;
  malpractice: boolean;
}

export interface QuizStateResponse {
  status: QuizStatus;
  startTime: string | null;
  endTime: string | null;
  durationSec: number;
  serverTime: string;
  hasFirstSubmission: boolean;
}

export interface AdminStats {
  registeredCount: number;
  startedCount: number;
  completedCount: number;
  malpracticeCount: number;
  quizStatus: QuizStatus;
  startTime: string | null;
}
