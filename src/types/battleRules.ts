export interface BattleRulesConfig {
  tickMs: number;
  maxDeltaMs: number;
  battleSpeedMultipliers: number[];
  defaultBattleSpeedMultiplier: number;
  enemyX: number;
  enemyStartY: number;
  enemyStopY: number;
  enemyMoveDivisor: number;
  enemyFirstShotDelayMs: number;
  enemyProjectileStartOffsetY: number;
  enemyProjectileMoveDivisor: number;
  enemyMeleeTriggerY: number;
  enemyMeleeIntervalMs: number;
  coreProjectileHitY: number;
  playerStartX: number;
  playerStartY: number;
  castleAttackRadius: number;
  botAttackRadius: number;
  enemyAttackRadius: number;
  maximumSimultaneousEnemyProjectiles: number;
  botFormationSlots: Array<{ x: number; y: number }>;
  botDiscSizeMultiplier: number;
  playerHomingMs: number;
  playerProjectileMoveDivisor: number;
  playerProjectileMinimumFlightMs: number;
  playerHitToleranceY: number;
  playerHitToleranceX: number;
  playerProjectileEndY: number;
  castleDiscDamageMultiplier: number;
  maxRenderedPlayerDiscSize: number;
  resultNoticeMs: number;
}

export interface BattleStageRulesConfig {
  hpMultiplierPerWin: number;
  attackMultiplierPerWin: number;
  moveSpeedMultiplierPerWin: number;
  extraEnemyEveryWins: number;
  extraEnemiesPerStep: number;
  maximumExtraEnemies: number;
  enemyDiscLevelEveryWins: number;
}
