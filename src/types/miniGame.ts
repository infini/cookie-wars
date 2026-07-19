export type MiniGamePlayer = 'A' | 'B';

export type MiniGamePhase =
  | 'setup'
  | 'countdownA'
  | 'playingA'
  | 'handoff'
  | 'countdownB'
  | 'playingB'
  | 'result';

export type MiniGameWinner = MiniGamePlayer | 'draw';

export interface MiniGameConfig {
  minimumDurationSeconds: number;
  maximumDurationSeconds: number;
  defaultDurationSeconds: number;
  durationStepSeconds: number;
  countdownSeconds: number;
  timerRefreshIntervalMs: number;
  cookieSizePixels: number;
  pressedCookieScale: number;
  pressInDurationMs: number;
  releaseSpringSpeed: number;
  releaseSpringBounciness: number;
}

export interface MiniGameScores {
  A: number;
  B: number;
}
