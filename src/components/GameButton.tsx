import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, gradients } from '../theme/colors';
import { fonts } from '../theme/typography';

type ButtonVariant = 'orange' | 'blue' | 'green' | 'red' | 'purple';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

const variantColors: Record<ButtonVariant, readonly [string, string]> = {
  orange: gradients.header,
  blue: gradients.blue,
  green: gradients.green,
  red: gradients.red,
  purple: gradients.purple,
};

export function GameButton({
  title,
  onPress,
  disabled = false,
  variant = 'orange',
  style,
  compact = false,
}: GameButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && !disabled && styles.pressed]}
    >
      <LinearGradient
        colors={disabled ? ['#C8C1BC', '#AAA29C'] : variantColors[variant]}
        style={[styles.gradient, compact && styles.compact]}
      >
        <Text style={[styles.text, compact && styles.compactText]}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  compact: { minHeight: 44, borderRadius: 14, paddingHorizontal: 14 },
  text: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  compactText: { fontSize: 15 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.94 },
});
