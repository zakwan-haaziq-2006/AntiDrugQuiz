import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatTimeMs } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ published: false, leaderboard: [] });
    }

    const completedCount = await prisma.attempt.count({
      where: {
        quizId: quiz.id,
        status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] },
      },
    });

    if (completedCount === 0) {
      return NextResponse.json({
        published: false,
        message: 'The leaderboard will be available once the first participant completes the quiz.',
        leaderboard: [],
      });
    }

    const attempts = await prisma.attempt.findMany({
      where: {
        quizId: quiz.id,
        status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] },
        malpractice: false,
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

    const leaderboard = attempts.map((attempt, index) => ({
      rank: index + 1,
      participantId: attempt.participant.id,
      name: attempt.participant.name,
      rollNumber: attempt.participant.rollNumber,
      department: attempt.participant.department,
      year: attempt.participant.year,
      section: attempt.participant.section,
      score: attempt.score ?? 0,
      completionTimeMs: attempt.completionTimeMs ?? 0,
      formattedTime: formatTimeMs(attempt.completionTimeMs),
      submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : '',
      malpractice: attempt.malpractice,
    }));

    return NextResponse.json({
      published: true,
      quizTitle: quiz.title,
      leaderboard,
      totalCompleted: completedCount,
    });
  } catch (error: any) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
