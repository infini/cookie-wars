import { BATTLE_AUDIO } from '../config';

export type BattleActionSoundName =
  | 'friendlyDisc'
  | 'enemyDisc'
  | 'giantDisc'
  | 'hitLight1'
  | 'hitLight2'
  | 'hitLight3'
  | 'hitHeavy'
  | 'bossMelee'
  | 'bossEnrage';

export type BattleSoundGroup = keyof typeof BATTLE_AUDIO.minimumIntervalMs;

export const BATTLE_ACTION_SOUND_NAMES: BattleActionSoundName[] = [
  'friendlyDisc',
  'enemyDisc',
  'giantDisc',
  'hitLight1',
  'hitLight2',
  'hitLight3',
  'hitHeavy',
  'bossMelee',
  'bossEnrage',
];

const LIGHT_HIT_SOUND_NAMES = [
  'hitLight1',
  'hitLight2',
  'hitLight3',
] as const satisfies readonly BattleActionSoundName[];

const SOUND_GROUPS: Record<BattleActionSoundName, BattleSoundGroup> = {
  friendlyDisc: 'friendlyDisc',
  enemyDisc: 'enemyDisc',
  giantDisc: 'giantDisc',
  hitLight1: 'hitLight',
  hitLight2: 'hitLight',
  hitLight3: 'hitLight',
  hitHeavy: 'hitHeavy',
  bossMelee: 'bossMelee',
  bossEnrage: 'bossEnrage',
};

export function isBattleActionSound(name: string): name is BattleActionSoundName {
  return BATTLE_ACTION_SOUND_NAMES.includes(name as BattleActionSoundName);
}

export function canPlayBattleActionSound(
  name: BattleActionSoundName,
  lastPlayedAt: Partial<Record<BattleSoundGroup, number>>,
  now: number,
): boolean {
  const group = SOUND_GROUPS[name];
  return now - (lastPlayedAt[group] ?? Number.NEGATIVE_INFINITY)
    >= BATTLE_AUDIO.minimumIntervalMs[group];
}

export function getBattleSoundGroup(name: BattleActionSoundName): BattleSoundGroup {
  return SOUND_GROUPS[name];
}

export function getLightHitSoundName(eventId: number): BattleActionSoundName {
  return LIGHT_HIT_SOUND_NAMES[Math.abs(eventId) % LIGHT_HIT_SOUND_NAMES.length];
}
