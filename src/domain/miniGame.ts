import type {
  MiniGameConfig,
  MiniGamePhase,
  MiniGamePlayer,
  MiniGameScores,
  MiniGameWinner,
} from '../types/game';

export function adjustMiniGameDuration(
  currentSeconds: number,
  stepDirection: -1 | 1,
  config: MiniGameConfig,
): number {
  return Math.min(
    config.maximumDurationSeconds,
    Math.max(
      config.minimumDurationSeconds,
      currentSeconds + stepDirection * config.durationStepSeconds,
    ),
  );
}

export function getMiniGamePlayer(phase: MiniGamePhase): MiniGamePlayer | null {
  if (phase === 'countdownA' || phase === 'playingA') return 'A';
  if (phase === 'countdownB' || phase === 'playingB') return 'B';
  return null;
}

export function getMiniGameWinner(scores: MiniGameScores): MiniGameWinner {
  if (scores.A === scores.B) return 'draw';
  return scores.A > scores.B ? 'A' : 'B';
}

export function getNextMiniGamePhaseAfterTimer(phase: MiniGamePhase): MiniGamePhase {
  switch (phase) {
    case 'countdownA': return 'playingA';
    case 'playingA': return 'handoff';
    case 'countdownB': return 'playingB';
    case 'playingB': return 'result';
    default: return phase;
  }
}
