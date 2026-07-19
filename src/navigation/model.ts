import navigationData from './navigation.json';
import type {
  MainMenuConfig,
  MainMenuId,
  NavigationBadgeKey,
  NavigationConfig,
  NavigationLeafConfig,
  RememberedMenuLeaves,
} from './types';
import type { TabId } from '../types/game';

export const MAIN_MENU_IDS: MainMenuId[] = ['game', 'miniGame', 'battle', 'growth', 'info'];
export const NAVIGATION_LEAF_IDS: TabId[] = [
  'game', 'miniGame', 'battle', 'upgrade', 'disc', 'bot', 'cookie', 'difficulty', 'monster',
];
const NAVIGATION_BADGE_KEYS: NavigationBadgeKey[] = ['newMonster'];

export class NavigationConfigError extends Error {
  constructor(path: string, reason: string) {
    super(`[메뉴 설정 오류] ${path}: ${reason}`);
    this.name = 'NavigationConfigError';
  }
}

type UnknownRecord = Record<string, unknown>;

function fail(path: string, reason: string): never {
  throw new NavigationConfigError(path, reason);
}

function record(value: unknown, path: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, '객체여야 합니다.');
  }
  return value as UnknownRecord;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) fail(path, '비어 있지 않은 배열이어야 합니다.');
  return value;
}

function stringValue(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(path, '비어 있지 않은 문자열이어야 합니다.');
  }
  return value;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  const text = stringValue(value, path);
  if (!allowed.includes(text as T)) fail(path, `지원하지 않는 값 '${text}'입니다.`);
  return text as T;
}

function assertUnique(values: string[], path: string): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) fail(`${path}[${index}]`, `중복 ID '${value}'입니다.`);
    seen.add(value);
  });
}

export function validateNavigationConfig(value: unknown): NavigationConfig {
  const root = record(value, 'NAVIGATION');
  const mainMenus = array(root.mainMenus, 'NAVIGATION.mainMenus').map((item, index) => {
    const path = `NAVIGATION.mainMenus[${index}]`;
    const menu = record(item, path);
    const leafIds = array(menu.leafIds, `${path}.leafIds`).map((leafId, leafIndex) => (
      enumValue(leafId, NAVIGATION_LEAF_IDS, `${path}.leafIds[${leafIndex}]`)
    ));
    assertUnique(leafIds, `${path}.leafIds`);
    return {
      id: enumValue(menu.id, MAIN_MENU_IDS, `${path}.id`),
      label: stringValue(menu.label, `${path}.label`),
      icon: stringValue(menu.icon, `${path}.icon`),
      defaultLeafId: enumValue(
        menu.defaultLeafId,
        NAVIGATION_LEAF_IDS,
        `${path}.defaultLeafId`,
      ),
      leafIds,
    };
  });
  const leaves = array(root.leaves, 'NAVIGATION.leaves').map((item, index) => {
    const path = `NAVIGATION.leaves[${index}]`;
    const leaf = record(item, path);
    const badgeKey = leaf.badgeKey === undefined
      ? undefined
      : enumValue(leaf.badgeKey, NAVIGATION_BADGE_KEYS, `${path}.badgeKey`);
    return {
      id: enumValue(leaf.id, NAVIGATION_LEAF_IDS, `${path}.id`),
      mainMenuId: enumValue(leaf.mainMenuId, MAIN_MENU_IDS, `${path}.mainMenuId`),
      label: stringValue(leaf.label, `${path}.label`),
      icon: stringValue(leaf.icon, `${path}.icon`),
      title: stringValue(leaf.title, `${path}.title`),
      ...(badgeKey === undefined ? {} : { badgeKey }),
    };
  });

  assertUnique(mainMenus.map((menu) => menu.id), 'NAVIGATION.mainMenus.id');
  assertUnique(leaves.map((leaf) => leaf.id), 'NAVIGATION.leaves.id');
  if (
    mainMenus.length !== MAIN_MENU_IDS.length
    || MAIN_MENU_IDS.some((id) => !mainMenus.some((menu) => menu.id === id))
  ) fail('NAVIGATION.mainMenus', '모든 대분류 ID를 정확히 한 번 포함해야 합니다.');
  if (
    leaves.length !== NAVIGATION_LEAF_IDS.length
    || NAVIGATION_LEAF_IDS.some((id) => !leaves.some((leaf) => leaf.id === id))
  ) fail('NAVIGATION.leaves', '모든 화면 ID를 정확히 한 번 포함해야 합니다.');

  const owners = new Map<TabId, MainMenuId>();
  mainMenus.forEach((menu, menuIndex) => {
    const path = `NAVIGATION.mainMenus[${menuIndex}]`;
    if (!menu.leafIds.includes(menu.defaultLeafId)) {
      fail(`${path}.defaultLeafId`, '같은 대분류의 leafIds에 포함되어야 합니다.');
    }
    menu.leafIds.forEach((leafId, leafIndex) => {
      if (owners.has(leafId)) {
        fail(`${path}.leafIds[${leafIndex}]`, `화면 '${leafId}'의 대분류가 중복됩니다.`);
      }
      owners.set(leafId, menu.id);
    });
  });
  leaves.forEach((leaf, index) => {
    const owner = owners.get(leaf.id);
    if (owner === undefined) fail(`NAVIGATION.leaves[${index}].id`, '대분류에서 참조하지 않습니다.');
    if (owner !== leaf.mainMenuId) {
      fail(`NAVIGATION.leaves[${index}].mainMenuId`, `대분류 '${owner}'와 일치해야 합니다.`);
    }
  });

  return { mainMenus, leaves };
}

export const NAVIGATION = validateNavigationConfig(navigationData);
export const MAIN_MENU_ITEMS = NAVIGATION.mainMenus;

const mainMenuById = new Map(NAVIGATION.mainMenus.map((menu) => [menu.id, menu]));
const leafById = new Map(NAVIGATION.leaves.map((leaf) => [leaf.id, leaf]));

function requireMainMenu(id: MainMenuId): MainMenuConfig {
  const menu = mainMenuById.get(id);
  if (!menu) fail(`NAVIGATION.mainMenus.${id}`, '정의되지 않은 대분류입니다.');
  return menu;
}

export function getNavigationLeaf(id: TabId): NavigationLeafConfig {
  const leaf = leafById.get(id);
  if (!leaf) fail(`NAVIGATION.leaves.${id}`, '정의되지 않은 화면입니다.');
  return leaf;
}

export function getMainMenuForLeaf(id: TabId): MainMenuConfig {
  return requireMainMenu(getNavigationLeaf(id).mainMenuId);
}

export function getScreenTitle(id: TabId): string {
  return getNavigationLeaf(id).title;
}

export function getSubmenuItemsForLeaf(id: TabId): NavigationLeafConfig[] {
  const menu = getMainMenuForLeaf(id);
  return menu.leafIds.length <= 1
    ? []
    : menu.leafIds.map(getNavigationLeaf);
}

export function rememberMenuLeaf(
  remembered: RememberedMenuLeaves,
  leafId: TabId,
): RememberedMenuLeaves {
  const menu = getMainMenuForLeaf(leafId);
  if (remembered[menu.id] === leafId) return remembered;
  return { ...remembered, [menu.id]: leafId };
}

export function resolveMainMenuTarget(
  menuId: MainMenuId,
  remembered: RememberedMenuLeaves,
): TabId {
  const menu = requireMainMenu(menuId);
  const rememberedLeaf = remembered[menuId];
  return rememberedLeaf && menu.leafIds.includes(rememberedLeaf)
    ? rememberedLeaf
    : menu.defaultLeafId;
}

export function leafHasActiveBadge(
  leaf: NavigationLeafConfig,
  activeBadges: readonly NavigationBadgeKey[],
): boolean {
  return leaf.badgeKey !== undefined && activeBadges.includes(leaf.badgeKey);
}

export function mainMenuHasActiveBadge(
  menuId: MainMenuId,
  activeBadges: readonly NavigationBadgeKey[],
): boolean {
  return requireMainMenu(menuId).leafIds.some((leafId) => (
    leafHasActiveBadge(getNavigationLeaf(leafId), activeBadges)
  ));
}
