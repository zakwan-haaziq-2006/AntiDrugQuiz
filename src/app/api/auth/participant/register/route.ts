import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/utils';
import { broadcastParticipantRegistered } from '@/lib/socket';

export const dynamic = 'force-dynamic';

const VALID_DEPARTMENTS = ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MCA', 'MBA'];
const VALID_YEARS = ['I', 'II', 'III', 'IV'];
const VALID_SECTIONS = ['A', 'B'];

export async function POST(request: Request) {
  try {
    const { name, rollNumber, department, year, section } = await request.json();

    if (!name || !name.trim() || !rollNumber || !rollNumber.trim()) {
      return NextResponse.json(
        { error: 'Full Name and Roll Number are required.' },
        { status: 400 }
      );
    }

    const cleanRoll = rollNumber.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanDept = (department || 'CSE').trim().toUpperCase();
    const cleanYear = (year || 'I').trim().toUpperCase();
    const cleanSection = (section || 'A').trim().toUpperCase();

    if (!VALID_DEPARTMENTS.includes(cleanDept)) {
      return NextResponse.json({ error: 'Please select a valid Department.' }, { status: 400 });
    }
    if (!VALID_YEARS.includes(cleanYear)) {
      return NextResponse.json({ error: 'Please select a valid Year.' }, { status: 400 });
    }
    if (!VALID_SECTIONS.includes(cleanSection)) {
      return NextResponse.json({ error: 'Please select a valid Section.' }, { status: 400 });
    }

    // Fetch active/upcoming quiz
    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ error: 'No active quiz found.' }, { status: 404 });
    }

    const now = new Date();
    let isExpired = quiz.status === 'ENDED';
    if (quiz.status === 'LIVE' && quiz.startTime) {
      const expiryTime = new Date(quiz.startTime.getTime() + (quiz.durationSec || 1800) * 1000);
      if (now >= expiryTime) {
        isExpired = true;
        await prisma.quiz.update({
          where: { id: quiz.id },
          data: { status: 'ENDED', endTime: expiryTime },
        });
      }
    }

    if (isExpired) {
      return NextResponse.json(
        { error: 'Registration Closed: The quiz competition duration has expired or ended.' },
        { status: 400 }
      );
    }

    // Check for existing participant by Roll Number
    let participant = await prisma.participant.findUnique({
      where: { rollNumber: cleanRoll },
    });

    if (participant) {
      // Check existing attempt status for this participant
      const existingAttempt = await prisma.attempt.findUnique({
        where: {
          quizId_participantId: {
            quizId: quiz.id,
            participantId: participant.id,
          },
        },
      });

      if (existingAttempt) {
        if (existingAttempt.status === 'DISQUALIFIED') {
          return NextResponse.json(
            { error: 'Registration Denied: You have been disqualified from this quiz competition due to malpractice violations. Multiple registrations are strictly prohibited.' },
            { status: 403 }
          );
        }

        if (existingAttempt.status === 'COMPLETED' || existingAttempt.status === 'AUTO_SUBMITTED') {
          return NextResponse.json(
            { error: 'Registration Denied: You have already completed and submitted your quiz attempt. Multiple entries are not permitted.' },
            { status: 403 }
          );
        }
      }
    } else {
      // Create new participant record
      participant = await prisma.participant.create({
        data: {
          name: cleanName,
          rollNumber: cleanRoll,
          department: cleanDept,
          year: cleanYear,
          section: cleanSection,
        },
      });
    }

    // Get or create attempt for IN_PROGRESS
    let attempt = await prisma.attempt.findUnique({
      where: {
        quizId_participantId: {
          quizId: quiz.id,
          participantId: participant.id,
        },
      },
    });

    if (!attempt) {
      attempt = await prisma.attempt.create({
        data: {
          quizId: quiz.id,
          participantId: participant.id,
          status: 'IN_PROGRESS',
        },
      });
    }

    const sessionPayload = {
      participantId: participant.id,
      attemptId: attempt.id,
      name: participant.name,
      rollNumber: participant.rollNumber,
      department: participant.department,
      year: participant.year,
      section: participant.section,
    };

    const token = signJwt(sessionPayload, '12h');

    try {
      broadcastParticipantRegistered({
        id: participant.id,
        attemptId: attempt.id,
        name: participant.name,
        rollNumber: participant.rollNumber,
        department: participant.department,
        year: participant.year,
        section: participant.section,
        createdAt: participant.createdAt ? participant.createdAt.toISOString() : new Date().toISOString(),
        status: attempt.status,
      });
    } catch (e) {
      console.warn('Socket broadcast warning:', e);
    }

    const response = NextResponse.json({
      success: true,
      participant,
      attemptId: attempt.id,
      quizStatus: quiz.status,
    });

    response.cookies.set('participant_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 43200,
    });

    return response;
  } catch (error: any) {
    console.error('Participant Registration Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process registration.' },
      { status: 500 }
    );
  }
}
