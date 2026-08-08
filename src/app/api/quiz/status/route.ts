import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    let status = quiz.status;
    const nowObj = new Date();

    if (status === 'LIVE' && quiz.startTime) {
      const expiryTime = new Date(quiz.startTime.getTime() + (quiz.durationSec || 1800) * 1000);
      if (nowObj >= expiryTime) {
        status = 'ENDED';
        await prisma.quiz.update({
          where: { id: quiz.id },
          data: { status: 'ENDED', endTime: expiryTime },
        });
      }
    }

    const completedAttemptsCount = await prisma.attempt.count({
      where: {
        quizId: quiz.id,
        status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] },
      },
    });

    const now = nowObj.toISOString();

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      status,
      startTime: quiz.startTime ? quiz.startTime.toISOString() : null,
      endTime: quiz.endTime ? quiz.endTime.toISOString() : null,
      durationSec: quiz.durationSec,
      serverTime: now,
      hasFirstSubmission: completedAttemptsCount > 0,
    });
  } catch (error: any) {
    console.error('Quiz Status API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
