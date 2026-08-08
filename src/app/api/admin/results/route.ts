import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt, formatTimeMs } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ results: [] });
    }

    const attempts = await prisma.attempt.findMany({
      where: { quizId: quiz.id },
      include: {
        participant: true,
        malpracticeEvents: true,
      },
      orderBy: [
        { score: 'desc' },
        { completionTimeMs: 'asc' },
        { submittedAt: 'asc' },
      ],
    });

    const results = attempts.map((attempt, index) => {
      const isCompleted = attempt.status === 'COMPLETED' || attempt.status === 'AUTO_SUBMITTED';
      const participant = attempt.participant;
      return {
        rank: isCompleted && !attempt.malpractice ? index + 1 : 'N/A',
        id: attempt.id,
        participantId: participant?.id || '',
        name: participant?.name || 'Registered Participant',
        rollNumber: participant?.rollNumber || 'N/A',
        department: participant?.department || 'N/A',
        year: participant?.year || 'I',
        section: participant?.section || 'A',
        score: attempt.score ?? 0,
        totalQuestions: 25,
        completionTimeMs: attempt.completionTimeMs ?? 0,
        formattedTime: formatTimeMs(attempt.completionTimeMs),
        submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : 'Not Submitted',
        status: attempt.status,
        malpractice: attempt.malpractice,
        tabSwitchCount: attempt.malpracticeEvents ? attempt.malpracticeEvents.length : 0,
      };
    });

    if (format === 'csv') {
      const headers = [
        'Rank',
        'Full Name',
        'Roll Number',
        'Department',
        'Year',
        'Section',
        'Score',
        'Total Questions',
        'Completion Duration',
        'Completion Time (ms)',
        'Submitted At',
        'Status',
        'Malpractice Flag',
        'Tab Switch Count',
      ].join(',');

      const rows = results.map((r) => [
        `"${r.rank}"`,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.rollNumber || '').replace(/"/g, '""')}"`,
        `"${(r.department || '').replace(/"/g, '""')}"`,
        `"${r.year || ''}"`,
        `"${r.section || ''}"`,
        r.score,
        r.totalQuestions,
        `"${r.formattedTime}"`,
        r.completionTimeMs,
        `"${r.submittedAt}"`,
        `"${r.status}"`,
        r.malpractice ? 'YES' : 'NO',
        r.tabSwitchCount,
      ].join(','));

      const csvContent = [headers, ...rows].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="anti_drug_quiz_results_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const waitingAttempts = attempts.filter((a) => a.status === 'IN_PROGRESS');
    const waitingParticipants = waitingAttempts.map((a) => ({
      id: a.participant?.id || a.id,
      attemptId: a.id,
      name: a.participant?.name || 'Registered Participant',
      rollNumber: a.participant?.rollNumber || 'N/A',
      department: a.participant?.department || 'N/A',
      year: a.participant?.year || 'I',
      section: a.participant?.section || 'A',
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      status: a.status,
    }));

    return NextResponse.json({
      quizTitle: quiz.title,
      quizStatus: quiz.status,
      totalRegistered: await prisma.participant.count(),
      totalWaiting: waitingParticipants.length,
      totalStarted: attempts.length,
      totalCompleted: attempts.filter((a) => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED').length,
      totalMalpractice: attempts.filter((a) => a.malpractice).length,
      waitingParticipants,
      results,
    });
  } catch (error: any) {
    console.error('Admin Results API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
