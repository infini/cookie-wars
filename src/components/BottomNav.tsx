import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { TabId } from '../types/game';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const items: NavItem[] = [
  { id: 'game', label: '게임', icon: 'gesture-tap-button' },
  { id: 'battle', label: '전투', icon: 'sword-cross' },
  { id: 'cookie', label: '쿠키', icon: 'cookie' },
  { id: 'upgrade', label: '강화', icon: 'arrow-up-bold-hexagon-outline' },
  { id: 'monster', label: '몬스터', icon: 'ghost' },
  { id: 'difficulty', label: '난이도', icon: 'stairs-up' },
  { id: 'disc', label: '원반', icon: 'disc-player' },
  { id: 'bot', label: '쿠키봇', icon: 'robot-happy' },
];

interface BottomNavProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  hasNewMonster: boolean;
}

export function BottomNav({ activeTab, onChange, hasNewMonster }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = item.id === activeTab;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.label} 화면`}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.item,
              active && styles.activeItem,
              pressed && styles.pressed,
            ]}
          >
            <View>
              <MaterialCommunityIcons
                name={item.icon}
                size={active ? 25 : 22}
                color={active ? colors.orange : colors.muted}
              />
              {item.id === 'monster' && hasNewMonster ? <View style={styles.newDot} /> : null}
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 70,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 5,
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  item: {
    flex: 1,
    minWidth: 0,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 5,
  },
  activeItem: { backgroundColor: '#FFF0D6' },
  label: { fontFamily: fonts.bold, fontSize: 8, color: colors.muted },
  activeLabel: { color: colors.cookieDark },
  pressed: { opacity: 0.66 },
  newDot: {
    position: 'absolute',
    right: -5,
    top: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.red,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
