import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/utils';

async function checkAdminAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;
  const decoded = verifyJwt<{ role: string }>(token);
  return decoded?.role === 'admin';
}

export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const setIdParam = searchParams.get('setId');

    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ questions: [], activeSet: 1 });
    }

    const whereCondition: any = { quizId: quiz.id };
    if (setIdParam) {
      whereCondition.setId = parseInt(setIdParam, 10);
    }

    const questions = await prisma.question.findMany({
      where: whereCondition,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ questions, activeSet: quiz.activeSet || 1 });
  } catch (error: any) {
    console.error('Admin Questions GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, order, setId } = await request.json();

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return NextResponse.json({ error: 'Invalid question fields or correct answer' }, { status: 400 });
    }

    const targetSet = setId ? parseInt(setId, 10) : (quiz.activeSet || 1);

    const maxOrder = await prisma.question.aggregate({
      where: { quizId: quiz.id, setId: targetSet },
      _max: { order: true },
    });

    const nextOrder = order !== undefined ? order : (maxOrder._max.order || 0) + 1;

    const question = await prisma.question.create({
      data: {
        quizId: quiz.id,
        setId: targetSet,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        order: nextOrder,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    console.error('Admin Questions POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, questionText, optionA, optionB, optionC, optionD, correctAnswer, order, setId } = await request.json();

    if (!id || !questionText || !optionA || !optionB || !optionC || !optionD || !['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        order: order !== undefined ? order : undefined,
        setId: setId !== undefined ? parseInt(setId, 10) : undefined,
      },
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    console.error('Admin Questions PUT Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Questions DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
