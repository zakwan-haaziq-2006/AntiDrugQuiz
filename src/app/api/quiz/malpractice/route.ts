import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/utils';
import { ParticipantSession } from '@/types';
import { broadcastMalpracticeDetected } from '@/lib/socket';

export const dynamic = 'force-dynamic';

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

    const { eventType, metadata } = await request.json();
    const timestamp = new Date();

    // Log malpractice event
    await prisma.malpracticeEvent.create({
      data: {
        attemptId: session.attemptId,
        eventType: eventType || 'TAB_SWITCH',
        timestamp,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Count total malpractice events for this attempt
    const malpracticeCount = await prisma.malpracticeEvent.count({
      where: { attemptId: session.attemptId },
    });

    // Check if malpractice count exceeds maximum allowed (2 warnings limit, 3rd causes disqualification)
    const isDisqualified = malpracticeCount > 2;

    if (isDisqualified) {
      // Fetch attempt and calculate score for auto-submit upon disqualification
      const attempt = await prisma.attempt.findUnique({
        where: { id: session.attemptId },
        include: { quiz: { include: { questions: true } } },
      });

      if (attempt && attempt.status === 'IN_PROGRESS') {
        const userAnswers = await prisma.answer.findMany({
          where: { attemptId: attempt.id },
        });

        const userAnswersMap = userAnswers.reduce((acc, curr) => {
          acc[curr.questionId] = curr.selectedAnswer;
          return acc;
        }, {} as Record<string, string>);

        let score = 0;
        for (const q of attempt.quiz.questions) {
          if (userAnswersMap[q.id] === q.correctAnswer) {
            score++;
          }
        }

        const quizStartTime = attempt.quiz.startTime || attempt.startedAt || timestamp;
        const completionTimeMs = Math.max(0, timestamp.getTime() - quizStartTime.getTime());

        await prisma.attempt.update({
          where: { id: session.attemptId },
          data: {
            status: 'DISQUALIFIED',
            malpractice: true,
            score,
            completionTimeMs,
            submittedAt: timestamp,
          },
        });
      }
    } else {
      await prisma.attempt.update({
        where: { id: session.attemptId },
        data: { malpractice: true },
      });
    }

    // Broadcast to Admin real-time monitoring
    try {
      broadcastMalpracticeDetected({
        participantId: session.participantId,
        participantName: session.name,
        rollNumber: session.rollNumber,
        attemptId: session.attemptId,
        eventType: eventType || 'TAB_SWITCH',
        timestamp: timestamp.toISOString(),
        totalSwitches: malpracticeCount,
        disqualified: isDisqualified,
      });
    } catch (e) {
      console.warn('Socket broadcast warning:', e);
    }

    return NextResponse.json({
      success: true,
      message: isDisqualified
        ? 'Disqualified: Exceeded maximum allowed malpractice limit (2 warnings).'
        : `Malpractice recorded. Warning ${malpracticeCount} of 2.`,
      incidentCount: malpracticeCount,
      disqualified: isDisqualified,
      maxAllowed: 2,
    });
  } catch (error: any) {
    console.error('Malpractice API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
