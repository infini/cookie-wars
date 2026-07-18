import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MAIN_MENU_ITEMS,
  getMainMenuForLeaf,
  mainMenuHasActiveBadge,
} from '../navigation/model';
import type { MainMenuId, NavigationBadgeKey } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { TabId } from '../types/game';

interface BottomNavProps {
  activeTab: TabId;
  onChange: (menuId: MainMenuId) => void;
  activeBadges: readonly NavigationBadgeKey[];
}

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function BottomNav({ activeTab, onChange, activeBadges }: BottomNavProps) {
  const activeMainMenuId = getMainMenuForLeaf(activeTab).id;
  return (
    <View style={styles.container}>
      {MAIN_MENU_ITEMS.map((item) => {
        const active = item.id === activeMainMenuId;
        const badged = mainMenuHasActiveBadge(item.id, activeBadges);
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
                name={item.icon as MaterialIconName}
                size={active ? 29 : 26}
                color={active ? colors.orange : colors.muted}
              />
              {badged ? <View style={styles.newDot} /> : null}
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
  label: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted },
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
