import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getSubmenuItemsForLeaf,
  leafHasActiveBadge,
} from '../navigation/model';
import type { NavigationBadgeKey } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { TabId } from '../types/game';

interface SubmenuNavProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  activeBadges: readonly NavigationBadgeKey[];
}

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function SubmenuNav({ activeTab, onChange, activeBadges }: SubmenuNavProps) {
  const items = getSubmenuItemsForLeaf(activeTab);
  if (items.length === 0) return null;

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {items.map((item) => {
        const active = item.id === activeTab;
        const badged = leafHasActiveBadge(item, activeBadges);
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
                size={20}
                color={active ? colors.orange : colors.muted}
              />
              {badged ? <View style={styles.newDot} /> : null}
            </View>
            <Text style={[styles.label, active && styles.activeLabel]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    flexDirection: 'row',
    padding: 4,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.92)',
    gap: 4,
  },
  item: {
    flex: 1,
    minWidth: 0,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
  activeItem: { backgroundColor: '#FFF0D6' },
  label: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted },
  activeLabel: { color: colors.cookieDark },
  pressed: { opacity: 0.66 },
  newDot: {
    position: 'absolute',
    right: -5,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    borderWidth: 1,
    borderColor: colors.white,
  },
});
