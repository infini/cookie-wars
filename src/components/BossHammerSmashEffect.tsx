import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { BOSS_SPECIAL_ATTACK } from '../config';
import { getBossSpecialAttackImpactProgress } from '../domain/bossSpecialAttack';

export const BossHammerSmashEffect = React.memo(function BossHammerSmashEffect({
  size,
  progress,
}: {
  size: number;
  progress: number;
}) {
  const impactProgress = getBossSpecialAttackImpactProgress(progress);
  if (impactProgress === null) return null;
  const opacity = 1 - impactProgress;
  const width = size * BOSS_SPECIAL_ATTACK.impactWidthMultiplier;
  const height = size * BOSS_SPECIAL_ATTACK.impactHeightMultiplier;
  const scale = BOSS_SPECIAL_ATTACK.impactStartScale + (
    BOSS_SPECIAL_ATTACK.impactEndScale - BOSS_SPECIAL_ATTACK.impactStartScale
  ) * impactProgress;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width,
        height,
        left: (size - width) / 2,
        top: size * BOSS_SPECIAL_ATTACK.impactTopRatio,
        zIndex: BOSS_SPECIAL_ATTACK.impactLayerIndex,
        opacity,
        transform: [{ scale }],
      }}
    >
      <Svg width={width} height={height} viewBox={BOSS_SPECIAL_ATTACK.impactViewBox}>
        <Ellipse
          cx={BOSS_SPECIAL_ATTACK.impactCenterX}
          cy={BOSS_SPECIAL_ATTACK.impactCenterY}
          rx={BOSS_SPECIAL_ATTACK.impactOuterRadiusX}
          ry={BOSS_SPECIAL_ATTACK.impactOuterRadiusY}
          fill={BOSS_SPECIAL_ATTACK.impactFillColor}
          stroke={BOSS_SPECIAL_ATTACK.impactGlowColor}
          strokeWidth={BOSS_SPECIAL_ATTACK.impactStrokeWidth
            * BOSS_SPECIAL_ATTACK.impactGlowStrokeMultiplier}
        />
        <Ellipse
          cx={BOSS_SPECIAL_ATTACK.impactCenterX}
          cy={BOSS_SPECIAL_ATTACK.impactCenterY}
          rx={BOSS_SPECIAL_ATTACK.impactInnerRadiusX}
          ry={BOSS_SPECIAL_ATTACK.impactInnerRadiusY}
          fill="none"
          stroke={BOSS_SPECIAL_ATTACK.impactRingColor}
          strokeWidth={BOSS_SPECIAL_ATTACK.impactStrokeWidth}
        />
        {BOSS_SPECIAL_ATTACK.impactCrackPaths.map((path) => (
          <Path
            key={path}
            d={path}
            fill="none"
            stroke={BOSS_SPECIAL_ATTACK.impactCrackColor}
            strokeWidth={BOSS_SPECIAL_ATTACK.impactCrackStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {BOSS_SPECIAL_ATTACK.dustParticles.map((particle, index) => (
          <Circle
            key={`${particle.x}-${particle.y}-${index}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.radius}
            fill={index % 2 === 0
              ? BOSS_SPECIAL_ATTACK.dustPrimaryColor
              : BOSS_SPECIAL_ATTACK.dustSecondaryColor}
          />
        ))}
      </Svg>
    </View>
  );
});
