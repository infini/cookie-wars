export interface EnemyDiscConfig {
  level: number;
  damage: number;
  size: number;
  speed: number;
  cooldownMs: number;
}

export interface DifficultyConfig {
  id: string;
  name: string;
  enemyWaveId: string;
  enemyCount: number;
  hpMultiplier: number;
  attackMultiplier: number;
  moveSpeed: number;
  enemyDiscLevel: number;
}

export interface BossBalanceConfig {
  playerPowerBaseSurvivalSeconds: number;
  hpMultiplierReference: number;
  hpScalingExponent: number;
  maximumPowerScaledSurvivalSeconds: number;
  minimumAutomaticHitsToDefeat: number;
}

export interface BossBehaviorConfig {
  globalAttackDamageMultiplier: number;
  globalAttackCooldownMultiplier: number;
  globalMoveSpeedMultiplier: number;
  globalDifficultyMultiplier: number;
  enrageHealthRatio: number;
  enrageAttackCooldownMultiplier: number;
  enrageProjectileDamageMultiplier: number;
  enrageMeleeDamageMultiplier: number;
  enrageAnnouncementMs: number;
}

export interface BossSpecialAttackConfig {
  intervalMs: number;
  windupMs: number;
  animationDurationMs: number;
  windupPeakProgress: number;
  slamPeakProgress: number;
  recoveryPeakProgress: number;
  spritePivotXRatio: number;
  spritePivotYRatio: number;
  windupRotationDeg: number;
  slamRotationDeg: number;
  recoveryRotationDeg: number;
  windupLeanDeg: number;
  slamLeanDeg: number;
  recoveryLeanDeg: number;
  windupTranslateXPixels: number;
  slamTranslateXPixels: number;
  recoveryTranslateXPixels: number;
  windupLiftPixels: number;
  slamDropPixels: number;
  recoveryTranslateYPixels: number;
  windupScale: number;
  slamScaleX: number;
  slamScaleY: number;
  recoveryScaleX: number;
  recoveryScaleY: number;
  impactWidthMultiplier: number;
  impactHeightMultiplier: number;
  impactTopRatio: number;
  impactLayerIndex: number;
  impactViewBox: string;
  impactCenterX: number;
  impactCenterY: number;
  impactOuterRadiusX: number;
  impactOuterRadiusY: number;
  impactInnerRadiusX: number;
  impactInnerRadiusY: number;
  impactStartScale: number;
  impactEndScale: number;
  impactStrokeWidth: number;
  impactGlowStrokeMultiplier: number;
  impactCrackStrokeWidth: number;
  impactFillColor: string;
  impactRingColor: string;
  impactGlowColor: string;
  impactCrackColor: string;
  impactCrackPaths: string[];
  dustPrimaryColor: string;
  dustSecondaryColor: string;
  dustParticles: Array<{ x: number; y: number; radius: number }>;
  screenFlashColor: string;
  screenFlashMaximumOpacity: number;
  screenShakePixels: number;
  screenShakeCycles: number;
  projectileScale: number;
  projectileBorderColor: string;
  projectileBackgroundColor: string;
  projectileTrailColor: string;
  projectileGlowColor: string;
  projectileGlowRadius: number;
}

export interface BattleMapConfig {
  id: string;
  difficultyId: string;
  name: string;
  imageKey: string;
}

export interface MonsterConfig {
  id: string;
  imageKey: string;
  name: string;
  rank: string;
  baseHp: number;
  baseAttack: number;
  moveSpeedMultiplier: number;
  discDamageMultiplier: number;
  sizeMultiplier: number;
  description: string;
}

export interface EnemyWaveConfig {
  id: string;
  name: string;
  monsterPatternIds: string[];
  bossMonsterId: string;
  bossEveryEnemies: number;
}
