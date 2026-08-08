import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt, formatTimeMs } from '@/lib/utils';
import { ParticipantSession } from '@/types';
import { broadcastLeaderboardUpdate } from '@/lib/socket';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('participant_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = verifyJwt<ParticipantSession>(token);
    if (!session || !session.attemptId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const isAutoSubmitted = body.autoSubmitted || false;

    // Fetch attempt with participant & quiz details
    const attempt = await prisma.attempt.findUnique({
      where: { id: session.attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
        participant: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt record not found' }, { status: 404 });
    }

    // Handle disqualified attempt
    if (attempt.status === 'DISQUALIFIED') {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        status: 'DISQUALIFIED',
        score: attempt.score ?? 0,
        totalQuestions: attempt.quiz.questions.length,
        completionTimeMs: attempt.completionTimeMs ?? 0,
        formattedTime: formatTimeMs(attempt.completionTimeMs),
        participantName: attempt.participant.name,
      });
    }

    // Prevent double submission
    if (attempt.status === 'COMPLETED' || attempt.status === 'AUTO_SUBMITTED') {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        status: attempt.status,
        score: attempt.score,
        totalQuestions: attempt.quiz.questions.length,
        completionTimeMs: attempt.completionTimeMs,
        formattedTime: formatTimeMs(attempt.completionTimeMs),
        participantName: attempt.participant.name,
      });
    }

    const submittedAt = new Date();
    const startTimeMs = Math.max(
      attempt.quiz.startTime ? attempt.quiz.startTime.getTime() : 0,
      attempt.startedAt ? attempt.startedAt.getTime() : 0
    ) || submittedAt.getTime();
    
    // High-precision completion time in milliseconds
    const completionTimeMs = Math.max(0, submittedAt.getTime() - startTimeMs);

    // Fetch all answers recorded for this attempt
    const userAnswers = await prisma.answer.findMany({
      where: { attemptId: attempt.id },
    });

    const userAnswersMap = userAnswers.reduce((acc, curr) => {
      acc[curr.questionId] = curr.selectedAnswer;
      return acc;
    }, {} as Record<string, string>);

    let score = 0;
    const questions = attempt.quiz.questions;

    // Score answers server-side
    for (const q of questions) {
      const selected = userAnswersMap[q.id];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) {
        score++;
      }

      // Mark isCorrect in DB for detailed audit
      if (selected) {
        await prisma.answer.updateMany({
          where: { attemptId: attempt.id, questionId: q.id },
          data: { isCorrect },
        });
      }
    }

    const finalStatus = isAutoSubmitted ? 'AUTO_SUBMITTED' : 'COMPLETED';

    // Update attempt atomically
    const updatedAttempt = await prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt,
        score,
        completionTimeMs,
        status: finalStatus,
      },
    });

    // Recalculate leaderboard & broadcast real-time update
    try {
      const leaderboardData = await getLeaderboardData(attempt.quizId);
      broadcastLeaderboardUpdate(leaderboardData);
    } catch (socketError) {
      console.warn('Socket broadcast warning:', socketError);
    }

    return NextResponse.json({
      success: true,
      score,
      totalQuestions: questions.length,
      completionTimeMs,
      formattedTime: formatTimeMs(completionTimeMs),
      participantName: attempt.participant.name,
      submittedAt: submittedAt.toISOString(),
      status: finalStatus,
    });
  } catch (error: any) {
    console.error('Quiz Submit API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Helper to compute high-precision server leaderboard
 */
async function getLeaderboardData(quizId: string) {
  const attempts = await prisma.attempt.findMany({
    where: {
      quizId,
      status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] },
      malpractice: false, // Exclude disqualified/malpractice from official public leaderboard
    },
    include: {
      participant: true,
    },
    orderBy: [
      { score: 'desc' },
      { completionTimeMs: 'asc' },
      { submittedAt: 'asc' },
    ],
    take: 10,
  });

  return attempts.map((a, index) => ({
    rank: index + 1,
    participantId: a.participant.id,
    name: a.participant.name,
    rollNumber: a.participant.rollNumber,
    department: a.participant.department,
    year: a.participant.year,
    section: a.participant.section,
    score: a.score ?? 0,
    completionTimeMs: a.completionTimeMs ?? 0,
    formattedTime: formatTimeMs(a.completionTimeMs),
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : '',
    malpractice: a.malpractice,
  }));
}
