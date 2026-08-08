import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/utils';
import { ParticipantSession } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('participant_token')?.value;

    let attemptId: string | null = null;
    if (token) {
      const decoded = verifyJwt<ParticipantSession>(token);
      if (decoded) {
        attemptId = decoded.attemptId;
      }
    }

    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
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

    let savedAnswers: Record<string, string> = {};

    if (attemptId) {
      const answersList = await prisma.answer.findMany({
        where: { attemptId },
        select: { questionId: true, selectedAnswer: true },
      });

      savedAnswers = answersList.reduce((acc, curr) => {
        acc[curr.questionId] = curr.selectedAnswer;
        return acc;
      }, {} as Record<string, string>);
    }

    return NextResponse.json({
      questions,
      savedAnswers,
      totalQuestions: questions.length,
    });
  } catch (error: any) {
    console.error('Questions API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
