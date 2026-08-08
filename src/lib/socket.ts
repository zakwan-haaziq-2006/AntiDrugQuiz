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

export function broadcastQuizStarted(startTime: string) {
  const io = getIO();
  if (io) {
    io.emit('QUIZ_STARTED', { startTime });
  }
}

export function broadcastLeaderboardUpdate(leaderboard: any) {
  const io = getIO();
  if (io) {
    io.emit('LEADERBOARD_UPDATED', leaderboard);
  }
}

export function broadcastQuizEnded() {
  const io = getIO();
  if (io) {
    io.emit('QUIZ_ENDED', { timestamp: new Date().toISOString() });
  }
}

export function broadcastMalpracticeDetected(eventData: any) {
  const io = getIO();
  if (io) {
    io.emit('MALPRACTICE_DETECTED', eventData);
  }
}

export function broadcastParticipantRegistered(participantData: any) {
  const io = getIO();
  if (io) {
    io.emit('PARTICIPANT_REGISTERED', participantData);
  }
}
