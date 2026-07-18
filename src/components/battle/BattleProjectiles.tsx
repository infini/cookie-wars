import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BATTLE_FEEDBACK,
  BATTLE_RULES,
  BATTLE_UI,
  BOSS_SPECIAL_ATTACK,
  GIANT_DISC,
} from '../../config';
import type { BattleProjectile } from '../../engine/useBattleEngine';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { DiscImage } from '../DiscImage';

interface EnemyProjectileLayerProps {
  projectiles: BattleProjectile[];
  now: number;
}

export function EnemyProjectileLayer({ projectiles, now }: EnemyProjectileLayerProps) {
  return (
    <>
      {projectiles.map((projectile) => {
        const isSpecialAttack = projectile.attackKind === 'special';
        return (
          <View
            key={projectile.id}
            style={[
              styles.projectile,
              styles.enemyProjectile,
              isSpecialAttack && {
                borderColor: BOSS_SPECIAL_ATTACK.projectileBorderColor,
                backgroundColor: BOSS_SPECIAL_ATTACK.projectileBackgroundColor,
                shadowColor: BOSS_SPECIAL_ATTACK.projectileGlowColor,
                shadowRadius: BOSS_SPECIAL_ATTACK.projectileGlowRadius,
                shadowOpacity: 1,
                elevation: 12,
                transform: [{ scale: BOSS_SPECIAL_ATTACK.projectileScale }],
              },
              {
                left: `${projectile.x * 100}%`,
                top: `${projectile.y * 100}%`,
                width: projectile.size,
                height: projectile.size,
                marginLeft: -projectile.size / 2,
                marginTop: -projectile.size / 2,
              },
            ]}
          >
            <View
              style={[
                styles.enemyProjectileTrail,
                {
                  width: projectile.size * BATTLE_FEEDBACK.enemyProjectileTrailWidthMultiplier,
                  height: projectile.size * BATTLE_FEEDBACK.enemyProjectileTrailLengthMultiplier,
                  top: -projectile.size * BATTLE_FEEDBACK.enemyProjectileTrailLengthMultiplier,
                  opacity: BATTLE_FEEDBACK.enemyProjectileTrailOpacity,
                  backgroundColor: isSpecialAttack
                    ? BOSS_SPECIAL_ATTACK.projectileTrailColor
                    : BATTLE_FEEDBACK.attackAuraBorderColor,
                  shadowColor: isSpecialAttack
                    ? BOSS_SPECIAL_ATTACK.projectileGlowColor
                    : BATTLE_FEEDBACK.screenFlashColor,
                  shadowRadius: isSpecialAttack
                    ? BOSS_SPECIAL_ATTACK.projectileGlowRadius
                    : BATTLE_FEEDBACK.enemyProjectileGlowRadius,
                },
              ]}
            />
            <View style={{
              transform: [{ rotate: `${((now - projectile.createdAt) / BATTLE_UI.projectileSpinDurationMs) * 360}deg` }],
            }}>
              <DiscImage size={projectile.size - BATTLE_FEEDBACK.impactRingBorderWidth} team="enemy" />
            </View>
          </View>
        );
      })}
    </>
  );
}

interface PlayerProjectileLayerProps {
  projectiles: BattleProjectile[];
  now: number;
  giantDiscRenderSize: number;
}

export function PlayerProjectileLayer({
  projectiles,
  now,
  giantDiscRenderSize,
}: PlayerProjectileLayerProps) {
  return (
    <>
      {projectiles.map((projectile) => {
        const isGiant = projectile.source === 'giant';
        const renderedMaximum = projectile.source === 'bot'
          ? BATTLE_RULES.maxRenderedPlayerDiscSize * BATTLE_RULES.botDiscSizeMultiplier
          : BATTLE_RULES.maxRenderedPlayerDiscSize;
        const renderedSize = isGiant
          ? giantDiscRenderSize
          : Math.min(projectile.size, renderedMaximum);
        const pulseProgress = (
          (now - projectile.createdAt) % GIANT_DISC.effectPulseDurationMs
        ) / GIANT_DISC.effectPulseDurationMs;
        const pulseScale = isGiant
          ? 1 + Math.sin(pulseProgress * Math.PI * 2) * GIANT_DISC.effectPulseScale
          : 1;
        return (
          <View
            key={projectile.id}
            style={[
              styles.projectile,
              projectile.source === 'castle' && styles.castleProjectile,
              isGiant && styles.giantProjectile,
              isGiant && { shadowColor: GIANT_DISC.effectGlowColor },
              {
                left: `${projectile.x * 100}%`,
                top: `${projectile.y * 100}%`,
                marginLeft: -renderedSize / 2,
                marginTop: -renderedSize / 2,
                width: renderedSize,
                height: renderedSize,
                transform: [
                  { rotate: `${((now - projectile.createdAt) / BATTLE_UI.projectileSpinDurationMs) * 360}deg` },
                  { scale: pulseScale },
                ],
              },
            ]}
          >
            {projectile.source === 'castle' ? <Text style={styles.doubleDamage}>2배</Text> : null}
            {isGiant ? (
              <>
                <View style={[styles.giantAuraOuter, {
                  borderColor: GIANT_DISC.effectOuterColor,
                  borderWidth: GIANT_DISC.effectRingBorderWidth,
                  backgroundColor: GIANT_DISC.effectOuterFillColor,
                }]} />
                <View style={[styles.giantAuraInner, {
                  borderColor: GIANT_DISC.effectInnerColor,
                  borderWidth: GIANT_DISC.effectRingBorderWidth / 2,
                  backgroundColor: GIANT_DISC.effectInnerFillColor,
                }]} />
                <Text style={[styles.giantDamage, {
                  color: GIANT_DISC.effectGlowColor,
                  textShadowColor: GIANT_DISC.effectTextShadowColor,
                }]}>{GIANT_DISC.damageMultiplier}배</Text>
              </>
            ) : null}
            <DiscImage size={renderedSize} />
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  projectile: { position: 'absolute', zIndex: 1800 },
  castleProjectile: { borderRadius: 50, backgroundColor: 'rgba(74,154,255,0.22)' },
  giantProjectile: { alignItems: 'center', justifyContent: 'center', borderRadius: 999, shadowOpacity: 1, shadowRadius: 24, elevation: 18 },
  giantAuraOuter: { position: 'absolute', width: '116%', height: '116%', borderRadius: 999, opacity: 0.82 },
  giantAuraInner: { position: 'absolute', width: '92%', height: '92%', borderRadius: 999, opacity: 0.9 },
  giantDamage: { position: 'absolute', top: -18, fontFamily: fonts.display, fontSize: 18, textShadowRadius: 8, zIndex: 3 },
  doubleDamage: { position: 'absolute', top: -9, alignSelf: 'center', zIndex: 2, fontFamily: fonts.extraBold, fontSize: 8, color: colors.blueDark, backgroundColor: colors.white, borderRadius: 5, paddingHorizontal: 3 },
  enemyProjectile: { borderWidth: 2, borderColor: colors.red, borderRadius: 30, backgroundColor: 'rgba(255,224,227,0.62)', alignItems: 'center', justifyContent: 'center' },
  enemyProjectileTrail: { position: 'absolute', alignSelf: 'center', borderRadius: 999, shadowOpacity: 1, elevation: 8 },
});
