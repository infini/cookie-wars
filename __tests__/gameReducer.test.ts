import { DIFFICULTIES, DISC, PRIMARY_BOT } from '../src/config';
import { gameReducer, initialGameState } from '../src/state/gameReducer';

describe('게임 저장 상태', () => {
  test('같은 난이도의 최초 승리 보상은 한 번만 지급한다', () => {
    const funded = { ...initialGameState, cookies: 10 };
    const first = gameReducer(funded, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
      reward: DIFFICULTIES[0].reward,
    });
    const replay = gameReducer(first, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
      reward: DIFFICULTIES[0].reward,
    });

    expect(first.cookies).toBe(10 + DIFFICULTIES[0].reward);
    expect(replay.cookies).toBe(first.cookies);
    expect(replay.rewardClaimedDifficultyIds).toEqual([DIFFICULTIES[0].id]);
  });

  test('승리하면 다음 난이도 하나만 해금한다', () => {
    const first = gameReducer(initialGameState, {
      type: 'COMPLETE_BATTLE',
      difficultyId: DIFFICULTIES[0].id,
      reward: DIFFICULTIES[0].reward,
    });
    expect(first.highestUnlockedDifficultyIndex).toBe(1);
  });

  test('원반은 충분한 쿠키가 있을 때 영구 구매된다', () => {
    const funded = { ...initialGameState, cookies: DISC.purchaseCost };
    const purchased = gameReducer(funded, { type: 'BUY_DISC' });
    const purchasedAgain = gameReducer(purchased, { type: 'BUY_DISC' });
    expect(purchased.discOwned).toBe(true);
    expect(purchased.cookies).toBe(0);
    expect(purchasedAgain).toEqual(purchased);
  });

  test('쿠키봇 구매 수량을 저장한다', () => {
    const funded = { ...initialGameState, cookies: 1000 };
    const bought = gameReducer(funded, {
      type: 'BUY_BOT',
      botId: PRIMARY_BOT.id,
      cost: PRIMARY_BOT.baseCost,
    });
    expect(bought.botCounts[PRIMARY_BOT.id]).toBe(1);
  });
});
