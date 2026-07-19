import {
  MAIN_MENU_ITEMS,
  NAVIGATION,
  getMainMenuForLeaf,
  getNavigationLeaf,
  getScreenTitle,
  getSubmenuItemsForLeaf,
  leafHasActiveBadge,
  mainMenuHasActiveBadge,
  rememberMenuLeaf,
  resolveMainMenuTarget,
  validateNavigationConfig,
} from '../src/navigation/model';

describe('대분류·소분류 메뉴 모델', () => {
  const cloneNavigation = (): any => JSON.parse(JSON.stringify(NAVIGATION));

  test('하단 대분류는 게임·대결·전투·강화·정보 순서로 표시한다', () => {
    expect(MAIN_MENU_ITEMS.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'game', label: '게임' },
      { id: 'miniGame', label: '대결' },
      { id: 'battle', label: '전투' },
      { id: 'growth', label: '강화' },
      { id: 'info', label: '정보' },
    ]);
  });

  test('강화와 정보는 요청한 세 화면만 정확한 한국어 이름으로 묶는다', () => {
    expect(getSubmenuItemsForLeaf('upgrade').map(({ id, label }) => ({ id, label })))
      .toEqual([
        { id: 'upgrade', label: '쿠키 강화' },
        { id: 'disc', label: '원반 강화' },
        { id: 'bot', label: '쿠키봇 강화' },
      ]);
    expect(getSubmenuItemsForLeaf('cookie').map(({ id, label }) => ({ id, label })))
      .toEqual([
        { id: 'cookie', label: '쿠키·훈장' },
        { id: 'difficulty', label: '난이도' },
        { id: 'monster', label: '몬스터' },
      ]);
  });

  test('게임과 대결과 전투는 자식이 하나라 소메뉴를 렌더하지 않는다', () => {
    expect(getSubmenuItemsForLeaf('game')).toEqual([]);
    expect(getSubmenuItemsForLeaf('miniGame')).toEqual([]);
    expect(getSubmenuItemsForLeaf('battle')).toEqual([]);
  });

  test('대분류 첫 진입은 기본 화면, 이후 진입은 세션에서 마지막으로 본 화면을 연다', () => {
    let remembered = {};
    expect(resolveMainMenuTarget('growth', remembered)).toBe('upgrade');
    expect(resolveMainMenuTarget('info', remembered)).toBe('cookie');

    remembered = rememberMenuLeaf(remembered, 'disc');
    remembered = rememberMenuLeaf(remembered, 'monster');
    expect(resolveMainMenuTarget('growth', remembered)).toBe('disc');
    expect(resolveMainMenuTarget('info', remembered)).toBe('monster');
    expect(resolveMainMenuTarget('game', remembered)).toBe('game');

    expect(resolveMainMenuTarget('growth', { growth: 'monster' } as any)).toBe('upgrade');
  });

  test('몬스터 NEW 배지는 정보 대분류와 몬스터 소메뉴에만 함께 표시한다', () => {
    const activeBadges = ['newMonster'] as const;
    expect(mainMenuHasActiveBadge('info', activeBadges)).toBe(true);
    expect(mainMenuHasActiveBadge('growth', activeBadges)).toBe(false);
    expect(leafHasActiveBadge(getNavigationLeaf('monster'), activeBadges)).toBe(true);
    expect(leafHasActiveBadge(getNavigationLeaf('cookie'), activeBadges)).toBe(false);
  });

  test('화면 제목과 부모 대분류도 같은 메뉴 데이터에서 제공한다', () => {
    expect(getScreenTitle('upgrade')).toBe('쿠키 강화');
    expect(getScreenTitle('disc')).toBe('원반 강화');
    expect(getScreenTitle('cookie')).toBe('쿠키와 전투 훈장');
    expect(getScreenTitle('miniGame')).toBe('A·B 쿠키 대결');
    expect(getMainMenuForLeaf('difficulty').id).toBe('info');
  });

  test('중복 ID, 잘못된 기본 화면과 부모 참조는 정확한 경로로 실패한다', () => {
    const duplicate = cloneNavigation();
    duplicate.mainMenus[1].id = duplicate.mainMenus[0].id;
    expect(() => validateNavigationConfig(duplicate)).toThrow('NAVIGATION.mainMenus.id');

    const wrongDefault = cloneNavigation();
    wrongDefault.mainMenus[2].defaultLeafId = 'cookie';
    expect(() => validateNavigationConfig(wrongDefault)).toThrow(
      'NAVIGATION.mainMenus[2].defaultLeafId',
    );

    const wrongParent = cloneNavigation();
    wrongParent.leaves.find((leaf: any) => leaf.id === 'disc').mainMenuId = 'info';
    expect(() => validateNavigationConfig(wrongParent)).toThrow(
      'NAVIGATION.leaves[4].mainMenuId',
    );
  });

  test('누락 필드와 한 화면의 대분류 중복도 앱 시작 전에 거부한다', () => {
    const missingTitle = cloneNavigation();
    delete missingTitle.leaves[0].title;
    expect(() => validateNavigationConfig(missingTitle)).toThrow('NAVIGATION.leaves[0].title');

    const duplicateOwner = cloneNavigation();
    duplicateOwner.mainMenus.find((menu: any) => menu.id === 'info').leafIds.push('disc');
    expect(() => validateNavigationConfig(duplicateOwner)).toThrow(
      'NAVIGATION.mainMenus[4].leafIds[3]',
    );
  });
});
