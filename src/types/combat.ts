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

export interface BossAnimationSetConfig {
  id: string;
  walkImageKeys: string[];
  hammerWindupImageKey: string;
  hammerImpactImageKey: string;
  hammerRecoveryImageKey: string;
}

export interface BossAnimationConfig {
  walkDistancePerCycle: number;
  walkFrameSequence: number[];
  impactHoldMs: number;
  recoveryMs: number;
  impactEffectDurationMs: number;
  sets: BossAnimationSetConfig[];
}

export interface BotAnimationSetConfig {
  id: string;
  runImageKeys: string[];
  throwWindupImageKey: string;
  throwReleaseImageKey: string;
  throwRecoveryImageKey: string;
}

export interface BotAnimationConfig {
  patrolCycleMs: number;
  patrolPhaseOffsetMs: number;
  patrolHorizontalRadius: number;
  patrolForwardDistance: number;
  targetFollowRatio: number;
  projectileReleaseOffsetX: number;
  projectileReleaseOffsetY: number;
  runFrameSequence: number[];
  throwWindupMs: number;
  throwReleaseHoldMs: number;
  throwRecoveryMs: number;
  sets: BotAnimationSetConfig[];
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
