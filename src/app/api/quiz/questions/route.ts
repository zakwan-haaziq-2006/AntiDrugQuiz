import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt, formatTimeMs } from '@/lib/utils';
import { ParticipantSession } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: session.attemptId },
      include: { participant: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt record not found' }, { status: 404 });
    }

    // Security check: Block access if participant is disqualified
    if (attempt.status === 'DISQUALIFIED') {
      return NextResponse.json(
        {
          error: 'You have been disqualified from this quiz competition due to malpractice violations.',
          status: 'DISQUALIFIED',
          attemptStatus: 'DISQUALIFIED',
          participantName: attempt.participant.name,
          score: attempt.score ?? 0,
          completionTimeMs: attempt.completionTimeMs ?? 0,
          formattedTime: formatTimeMs(attempt.completionTimeMs),
        },
        { status: 403 }
      );
    }

    // Security check: Block question access if quiz has not been started by admin
    if (quiz.status === 'UPCOMING') {
      return NextResponse.json(
        { error: 'Quiz has not started yet. Please wait for the event administrator to start the quiz.' },
        { status: 403 }
      );
    }

    const questions = await prisma.question.findMany({
      where: { quizId: quiz.id },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        order: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        // Exclude correctAnswer for security
      },
    });

    const answersList = await prisma.answer.findMany({
      where: { attemptId: attempt.id },
      select: { questionId: true, selectedAnswer: true },
    });

    const savedAnswers = answersList.reduce((acc, curr) => {
      acc[curr.questionId] = curr.selectedAnswer;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      questions,
      savedAnswers,
      totalQuestions: questions.length,
      quizStatus: quiz.status,
      quizStartTime: quiz.startTime ? quiz.startTime.toISOString() : null,
      durationSec: quiz.durationSec,
      attemptId: attempt.id,
      attemptStatus: attempt.status,
      participantName: attempt.participant.name,
      score: attempt.score,
      completionTimeMs: attempt.completionTimeMs,
      formattedTime: formatTimeMs(attempt.completionTimeMs),
    });
  } catch (error: any) {
    console.error('Questions API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
