import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/utils';
import { broadcastQuizStarted, broadcastQuizEnded } from '@/lib/socket';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Admin login required' }, { status: 401 });
    }

    const decoded = verifyJwt<{ adminId: string; role: string }>(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { action } = await request.json();

    const quiz = await prisma.quiz.findFirst({
      include: { questions: true },
    });
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (action === 'START') {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + quiz.durationSec * 1000);

      const updatedQuiz = await prisma.quiz.update({
        where: { id: quiz.id },
        data: {
          status: 'LIVE',
          startTime,
          endTime,
        },
      });

      try {
        broadcastQuizStarted(startTime.toISOString());
      } catch (e) {
        console.warn('Socket broadcast warning:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Quiz started successfully',
        status: updatedQuiz.status,
        startTime: updatedQuiz.startTime,
        endTime: updatedQuiz.endTime,
      });
    }

    if (action === 'END') {
      const now = new Date();
      const updatedQuiz = await prisma.quiz.update({
        where: { id: quiz.id },
        data: {
          status: 'ENDED',
          endTime: now,
        },
      });

      // Find all in-progress attempts and auto-submit them
      const inProgressAttempts = await prisma.attempt.findMany({
        where: { quizId: quiz.id, status: 'IN_PROGRESS' },
        include: { answers: true },
      });

      const startTimeMs = quiz.startTime ? quiz.startTime.getTime() : now.getTime();
      const completionTimeMs = Math.max(0, now.getTime() - startTimeMs);

      for (const attempt of inProgressAttempts) {
        const userAnswersMap = attempt.answers.reduce((acc, curr) => {
          acc[curr.questionId] = curr.selectedAnswer;
          return acc;
        }, {} as Record<string, string>);

        let score = 0;
        for (const q of quiz.questions) {
          if (userAnswersMap[q.id] === q.correctAnswer) {
            score++;
          }
        }

        await prisma.attempt.update({
          where: { id: attempt.id },
          data: {
            score,
            completionTimeMs,
            submittedAt: now,
            status: 'AUTO_SUBMITTED',
          },
        });
      }

      try {
        broadcastQuizEnded();
      } catch (e) {
        console.warn('Socket broadcast warning:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Quiz ended successfully. All in-progress attempts finalized.',
        status: updatedQuiz.status,
      });
    }

    if (action === 'RESET') {
      const updatedQuiz = await prisma.quiz.update({
        where: { id: quiz.id },
        data: {
          status: 'UPCOMING',
          startTime: null,
          endTime: null,
        },
      });

      // Clear all attempts, answers, and malpractice events
      await prisma.answer.deleteMany({});
      await prisma.malpracticeEvent.deleteMany({});
      await prisma.attempt.deleteMany({});

      return NextResponse.json({
        success: true,
        message: 'Quiz state reset successfully',
        status: updatedQuiz.status,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin Quiz Control Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
