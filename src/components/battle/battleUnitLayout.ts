import { BATTLE_UI } from '../../config';

export function getPerspectiveScale(y: number): number {
  const progress = Math.max(0, Math.min(1, (
    y - BATTLE_UI.unitPerspectiveFarY
  ) / (
    BATTLE_UI.unitPerspectiveNearY - BATTLE_UI.unitPerspectiveFarY
  )));
  return BATTLE_UI.unitPerspectiveFarScale
    + (BATTLE_UI.unitPerspectiveNearScale - BATTLE_UI.unitPerspectiveFarScale) * progress;
}
