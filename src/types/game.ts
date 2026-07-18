export type TabId =
  | 'game'
  | 'battle'
  | 'cookie'
  | 'upgrade'
  | 'monster'
  | 'difficulty'
  | 'disc'
  | 'bot';

export type SoundVolumeLevel = 1 | 2 | 3 | 4 | 5;

export interface UpgradeLevelConfig {
  level: number;
  value: number;
  cost: number;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  unit: string;
  enabled?: boolean;
  visible?: boolean;
  renderBaseSizePixels?: number;
  renderMaximumSizePixels?: number;
  levels: UpgradeLevelConfig[];
}

export interface InfiniteUpgradeRuleConfig {
  valueIncreasePerLevel: number;
  costGrowthMultiplier: number;
}

export type CookieUpgradeRulesConfig = Record<string, InfiniteUpgradeRuleConfig>;

export interface DiscLevelConfig {
  level: number;
  damage: number;
  size: number;
  speed: number;
  cooldownMs: number;
  cost: number;
}

export interface DiscConfig {
  id: string;
  name: string;
  purchaseCost: number;
  description: string;
  levels: DiscLevelConfig[];
}

export interface DiscUpgradeRulesConfig {
  damageGrowthMultiplier: number;
  sizeIncreasePerLevel: number;
  speedIncreasePerLevel: number;
  cooldownReductionMsPerLevel: number;
  minimumCooldownMs: number;
  costGrowthMultiplier: number;
}

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

export interface GiantDiscConfig {
  damageMultiplier: number;
  speedMultiplier: number;
  attackRadius: number;
  renderWidthRatio: number;
  effectPulseDurationMs: number;
  launchNoticeMs: number;
  effectPulseScale: number;
  effectRingBorderWidth: number;
  effectOuterColor: string;
  effectInnerColor: string;
  effectGlowColor: string;
  effectOuterFillColor: string;
  effectInnerFillColor: string;
  effectTextShadowColor: string;
  buttonBackgroundColor: string;
  buttonDisabledColor: string;
  buttonBorderColor: string;
  buttonCountColor: string;
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

export interface BotConfig {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  baseCost: number;
  costMultiplier: number;
  discDamageMultiplier: number;
  attackIntervalMs: number;
}

export interface CookieConfig {
  id: string;
  imageKey: string;
  name: string;
  description: string;
  requiredTotalUpgradeLevels: number;
  clickMultiplier: number;
  autoProductionMultiplier: number;
  healthMultiplier: number;
}

export interface ProgressionConfig {
  winsToUnlockNextDifficulty: number;
  giantDiscRewardPerFirstClear: number;
  saveDebounceMs: number;
  autoProductionIntervalMs: number;
}

export interface AudioLevelConfig {
  level: SoundVolumeLevel;
  volume: number;
}

export interface AudioSettingsConfig {
  defaultLevel: SoundVolumeLevel;
  previewDelayMs: number;
  levels: AudioLevelConfig[];
}

export interface BattleAudioConfig {
  minimumIntervalMs: {
    friendlyDisc: number;
    enemyDisc: number;
    giantDisc: number;
    hitLight: number;
    hitHeavy: number;
    bossMelee: number;
    bossEnrage: number;
  };
  volumeMultipliers: {
    friendlyDisc: number;
    enemyDisc: number;
    giantDisc: number;
    hitLight1: number;
    hitLight2: number;
    hitLight3: number;
    hitHeavy: number;
    bossMelee: number;
    bossEnrage: number;
    battleMusic: number;
  };
}

export interface BattleFeedbackConfig {
  enemyAttackDurationMs: number;
  enemyAttackWindupMs: number;
  enemyAttackLungePixels: number;
  enemyAttackScale: number;
  enemyAttackWindupScale: number;
  enemyAttackShakeCycles: number;
  enemyHitDurationMs: number;
  enemyHitShakePixels: number;
  enemyHitScale: number;
  enemyHitShakeCycles: number;
  auraSizeMultiplier: number;
  enragePulseScale: number;
  castleHitDurationMs: number;
  castleHitShakePixels: number;
  castleHitScale: number;
  impactEffectDurationMs: number;
  impactBurstDurationMs: number;
  impactEffectSize: number;
  impactRingBorderWidth: number;
  impactStartScale: number;
  impactEndScale: number;
  impactInnerScale: number;
  impactSparkCount: number;
  impactSparkLength: number;
  impactSparkWidth: number;
  impactSparkTravelPixels: number;
  impactSparkEndScale: number;
  impactBursts: Array<{
    xRatio: number;
    yRatio: number;
    delayMs: number;
    scale: number;
    rotationDeg: number;
  }>;
  fieldShockwaveDurationMs: number;
  fieldShockwaveSize: number;
  fieldShockwaveHeightRatio: number;
  fieldShockwaveStartScale: number;
  fieldShockwaveEndScale: number;
  fieldShockwaveMaximumOpacity: number;
  fieldShockwaveBorderWidth: number;
  damageTextRisePixels: number;
  enemyProjectileTrailLengthMultiplier: number;
  enemyProjectileTrailWidthMultiplier: number;
  enemyProjectileTrailOpacity: number;
  enemyProjectileGlowRadius: number;
  attackAuraColor: string;
  attackAuraBorderColor: string;
  attackAuraBorderWidth: number;
  enrageAuraColor: string;
  enrageAuraBorderColor: string;
  impactOuterColor: string;
  impactInnerColor: string;
  impactSparkColor: string;
  impactSecondaryColor: string;
  castleImpactOuterColor: string;
  castleImpactInnerColor: string;
  castleImpactSparkColor: string;
  castleImpactSecondaryColor: string;
  screenFlashColor: string;
  screenFlashMaximumOpacity: number;
  damageTextColor: string;
  damageTextOutlineColor: string;
  damageTextFontSize: number;
  damageTextWidth: number;
}

export interface SaveMigrationsConfig {
  botIdAliases: Record<string, string>;
  discIdAliases: Record<string, string>;
  monsterIdAliases: Record<string, string>;
}

export interface BattleRulesConfig {
  tickMs: number;
  maxDeltaMs: number;
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

export interface BattleUiConfig {
  castleRenderSize: number;
  castleTouchWidth: number;
  botRenderSize: number;
  botLabelWidth: number;
  enemyBaseRenderSize: number;
  enemyMinimumRenderSize: number;
  enemyMaximumRenderSize: number;
  enemyLabelWidth: number;
  enemyHealthWidth: number;
  castleHealthWidth: number;
  bossHealthHudTop: number;
  bossHealthWidthRatio: number;
  bossHealthBarHeight: number;
  giantDiscButtonTop: number;
  unitPerspectiveFarY: number;
  unitPerspectiveNearY: number;
  unitPerspectiveFarScale: number;
  unitPerspectiveNearScale: number;
  enemyAnchorLabelOffset: number;
  groundShadowColor: string;
  groundShadowWidthRatio: number;
  groundShadowHeightRatio: number;
  groundShadowBottomRatio: number;
  projectileSpinDurationMs: number;
  healthBarHeight: number;
  healthBarOutlineWidth: number;
  healthBarOutlineColor: string;
  healthBarTrackColor: string;
  healthBarLowHue: number;
  healthBarHighHue: number;
  healthBarSaturationPercent: number;
  healthBarLightnessPercent: number;
}

export interface GameState {
  saveVersion: number;
  cookies: number;
  lifetimeCookies: number;
  upgradeLevels: Record<string, number>;
  ownedDiscIds: string[];
  discLevels: Record<string, number>;
  selectedDiscId: string;
  botCounts: Record<string, number>;
  selectedDifficultyId: string;
  highestUnlockedDifficultyIndex: number;
  difficultyWinCounts: Record<string, number>;
  clearedDifficultyIds: string[];
  rewardClaimedStageIds: string[];
  giantDiscCount: number;
  discoveredMonsterIds: string[];
  newMonsterIds: string[];
  soundEnabled: boolean;
  soundVolumeLevel: SoundVolumeLevel;
  vibrationEnabled: boolean;
  lastSavedAt: number;
}

export interface CookieStats {
  clickPower: number;
  cookieRenderSize: number;
  autoProduction: number;
  maxHealth: number;
  cookieLevel: number;
  activeCookieId: string;
  totalUpgradeLevels: number;
}

export interface BattleRewardResult {
  firstClear: boolean;
  giantDiscReward: number;
  stageNumber: number;
  difficultyWins: number;
  winsRequired: number;
  unlockedNextDifficulty: boolean;
}
