import type { TabId } from '../types/game';

export type MainMenuId = 'game' | 'miniGame' | 'battle' | 'growth' | 'info';
export type NavigationBadgeKey = 'newMonster';

export interface MainMenuConfig {
  id: MainMenuId;
  label: string;
  icon: string;
  defaultLeafId: TabId;
  leafIds: TabId[];
}

export interface NavigationLeafConfig {
  id: TabId;
  mainMenuId: MainMenuId;
  label: string;
  icon: string;
  title: string;
  badgeKey?: NavigationBadgeKey;
}

export interface NavigationConfig {
  mainMenus: MainMenuConfig[];
  leaves: NavigationLeafConfig[];
}

export type RememberedMenuLeaves = Partial<Record<MainMenuId, TabId>>;
