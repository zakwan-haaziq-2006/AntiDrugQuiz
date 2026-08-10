import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/utils';
import { ParticipantSession } from '@/types';
import { getOptionMappings, OptionKey } from '@/lib/shuffle';

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

    const { questionId, selectedAnswer } = await request.json();

    if (!questionId || !['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
      return NextResponse.json({ error: 'Invalid answer selection' }, { status: 400 });
    }

    // Verify attempt is still IN_PROGRESS and quiz timer is valid
    const attempt = await prisma.attempt.findUnique({
      where: { id: session.attemptId },
      include: { quiz: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt record not found' }, { status: 404 });
    }

    if (attempt.status === 'DISQUALIFIED') {
      return NextResponse.json(
        { error: 'You are disqualified from this quiz competition due to malpractice violations.', status: 'DISQUALIFIED', isDisqualified: true },
        { status: 403 }
      );
    }

    if (attempt.status !== 'IN_PROGRESS' || attempt.quiz.status === 'ENDED') {
      return NextResponse.json(
        { error: 'Cannot modify answers. Quiz has ended or attempt is finalized.', timeExpired: true },
        { status: 400 }
      );
    }

    const now = new Date();
    if (attempt.quiz.startTime && attempt.quiz.durationSec) {
      const expiryTime = new Date(attempt.quiz.startTime.getTime() + attempt.quiz.durationSec * 1000);
      if (now >= expiryTime) {
        await prisma.quiz.update({
          where: { id: attempt.quiz.id },
          data: { status: 'ENDED', endTime: expiryTime },
        });
        return NextResponse.json(
          { error: 'Time expired! Quiz competition has ended and answers are locked.', timeExpired: true },
          { status: 400 }
        );
      }
    }

    // Fetch original question details to translate displayed option key to original DB option key
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const { displayedToOriginal } = getOptionMappings(session.attemptId, question);
    const originalAnswerKey = displayedToOriginal[selectedAnswer as OptionKey] || selectedAnswer;

    // Upsert answer progressively with original answer key
    await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: session.attemptId,
          questionId,
        },
      },
      update: {
        selectedAnswer: originalAnswerKey,
        answeredAt: new Date(),
      },
      create: {
        attemptId: session.attemptId,
        questionId,
        selectedAnswer: originalAnswerKey,
        answeredAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, questionId, selectedAnswer });
  } catch (error: any) {
    console.error('Save Answer API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

