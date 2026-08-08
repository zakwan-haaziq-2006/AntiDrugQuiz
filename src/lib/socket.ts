import { Server as SocketIOServer } from 'socket.io';

declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | null {
  if (globalThis.io) {
    return globalThis.io;
  }
  return null;
}

async function emitSocketEvent(event: string, data: any) {
  const io = getIO();
  if (io) {
    io.emit(event, data);
    return;
  }

  // Serverless execution (e.g., Vercel API Route) - forward event to Railway WebSocket Server
  const wsServerUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.RAILWAY_WS_URL;
  if (wsServerUrl) {
    try {
      const baseUrl = wsServerUrl.replace(/\/$/, '');
      const fullUrl = baseUrl.startsWith('http') ? `${baseUrl}/api/socket-emit` : `https://${baseUrl}/api/socket-emit`;
      const secret = process.env.JWT_SECRET || 'antidrug_club_secret_key_2026_secure';

      await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-socket-secret': secret,
        },
        body: JSON.stringify({ event, data }),
      });
    } catch (err) {
      console.warn(`[Socket Broadcast Error] Failed to forward event "${event}" to remote WebSocket server:`, err);
    }
  }
}

export function broadcastQuizStarted(startTime: string) {
  emitSocketEvent('QUIZ_STARTED', { startTime });
}

export function broadcastLeaderboardUpdate(leaderboard: any) {
  emitSocketEvent('LEADERBOARD_UPDATED', leaderboard);
}

export function broadcastQuizEnded() {
  emitSocketEvent('QUIZ_ENDED', { timestamp: new Date().toISOString() });
}

export function broadcastMalpracticeDetected(eventData: any) {
  emitSocketEvent('MALPRACTICE_DETECTED', eventData);
}

export function broadcastParticipantRegistered(participantData: any) {
  emitSocketEvent('PARTICIPANT_REGISTERED', participantData);
}
