import type { ActiveBot } from '../domain/gameSelectors';
import type {
  DifficultyConfig,
  DiscLevelConfig,
  EnemyDiscConfig,
} from '../types/game';

export type BattleStatus = 'idle' | 'active' | 'victory' | 'defeat';
export type BattleEventKind =
  | 'enemyHit'
  | 'castleHit'
  | 'disc'
  | 'enemyDisc'
  | 'bossSpecialAttack'
  | 'bossEnraged'
  | 'enemyDefeated'
  | 'victory'
  | 'defeat';

export interface BattleEnemy {
  id: string;
  monsterId: string;
  imageKey: string;
  name: string;
  rank: string;
  hp: number;
  maxHp: number;
  attack: number;
  moveSpeedMultiplier: number;
  discDamageMultiplier: number;
  sizeMultiplier: number;
  x: number;
  y: number;
  spawnAt: number;
  lastShotAt: number;
  lastMeleeAt: number;
  /** 공격 사거리 진입 또는 직전 강공격부터 다음 강공격까지의 주기 기준점. */
  specialAttackCycleStartedAt: number;
  /** 실제 강공격이 실행된 마지막 시각. 애니메이션 재생 기준으로만 사용한다. */
  lastSpecialAttackAt: number;
  enraged: boolean;
}

export type BattleAttackKind = 'projectile' | 'melee' | 'special';

export interface BattleProjectile {
  id: string;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  targetId?: string;
  sourceEnemyId?: string;
  sourceBotId?: string;
  source?: 'castle' | 'bot' | 'giant';
  attackKind?: BattleAttackKind;
  level: number;
  damage: number;
  size: number;
  speed: number;
  createdAt: number;
}

export interface BattleEvent {
  id: number;
  kind: BattleEventKind;
  at: number;
  amount?: number;
  x?: number;
  y?: number;
  sourceEnemyId?: string;
  attackKind?: BattleAttackKind;
  attackSource?: 'castle' | 'bot' | 'giant';
}

export interface BattleEventJournal {
  eventSequence: number;
  /** Bounded history used only for visual presentation. */
  events: BattleEvent[];
  /** Lossless queue retained until the hook acknowledges delivery. */
  pendingEvents: BattleEvent[];
}

export interface BattleState extends BattleEventJournal {
  status: BattleStatus;
  now: number;
  enemies: BattleEnemy[];
  enemyProjectiles: BattleProjectile[];
  playerProjectiles: BattleProjectile[];
  baseHealth: number;
  baseMaxHealth: number;
  killedEnemies: number;
  lastCastleThrowAt: number;
  lastBotAttackAt: Record<string, number>;
  lastBotAttackPerformedAt: Record<string, number>;
  notice: string | null;
  noticeUntil: number;
}

export interface AdvanceOptions {
  difficulty: DifficultyConfig;
  enemyDisc: EnemyDiscConfig;
  playerDisc: DiscLevelConfig;
  bots: ActiveBot[];
  now: number;
  deltaMs: number;
}

export interface BattleFrame extends BattleEventJournal {
  enemies: BattleEnemy[];
  enemyProjectiles: BattleProjectile[];
  playerProjectiles: BattleProjectile[];
  baseHealth: number;
  killedEnemies: number;
  lastBotAttackAt: Record<string, number>;
  lastBotAttackPerformedAt: Record<string, number>;
  notice: string | null;
  noticeUntil: number;
}

export type BattleEventDetails = Omit<
  BattleEvent,
  'id' | 'kind' | 'at'
> & { at?: number };

export function createInitialBattleState(
  now: number,
  eventSequence = 0,
): BattleState {
  return {
    status: 'idle',
    now,
    enemies: [],
    enemyProjectiles: [],
    playerProjectiles: [],
    baseHealth: 0,
    baseMaxHealth: 0,
    killedEnemies: 0,
    lastCastleThrowAt: 0,
    lastBotAttackAt: {},
    lastBotAttackPerformedAt: {},
    notice: null,
    noticeUntil: 0,
    eventSequence,
    events: [],
    pendingEvents: [],
  };
}

export function createBattleSessionState(
  previousState: BattleState,
  now: number,
): BattleState {
  return {
    ...createInitialBattleState(now, previousState.eventSequence),
    pendingEvents: [...previousState.pendingEvents],
  };
}
